import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

const SITE_URL =
  "https://pickshort-nextjs-y3hl.vercel.app/";

const INDEXNOW_KEY =
  "01c49390b1864f3495f1fd1c5d0ab7e1";

const INDEXNOW_ENDPOINT =
  "https://api.indexnow.org/indexnow";

export const runtime = "nodejs";

// IndexNow 저장 상태 조회 API
export async function GET() {
  try {
    const headers = {
      "Cache-Control": "private, no-store",
    };

    // 1. Supabase 서버 인증
    const supabase = await createClient();

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        {
          success: false,
          message: "로그인이 필요합니다.",
        },
        { status: 401, headers }
      );
    }

    // 2. 관리자 권한 확인
    const { data: adminData, error: adminError } =
      await supabase.rpc("is_admin");

    if (adminError || adminData !== true) {
      return NextResponse.json(
        {
          success: false,
          message: "관리자 권한이 필요합니다.",
        },
        { status: 403, headers }
      );
    }

    // 3. Supabase에 저장된 IndexNow 상태 조회
    const { data: statusData, error: statusError } =
      await supabase.rpc("indexnow_get_status");

    if (statusError || !statusData) {
      console.error(
        "IndexNow 상태 조회 실패:",
        statusError
      );

      return NextResponse.json(
        {
          success: false,
          message: "IndexNow 상태 조회에 실패했습니다.",
        },
        {
          status:
            statusError?.code === "42501" ? 403 : 500,
          headers,
        }
      );
    }

    // 4. 저장된 상태 반환
    return NextResponse.json(
      {
        success: true,
        ...statusData,
        server_time: new Date().toISOString(),
      },
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error(
      "IndexNow 상태 조회 API 오류:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "상태 조회 중 오류가 발생했습니다.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    // 1. 동일 출처 요청 확인
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json(
        {
          success: false,
          message: "허용되지 않은 요청입니다.",
        },
        { status: 403 }
      );
    }

    // 2. Supabase 서버 인증
    const supabase = await createClient();

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        {
          success: false,
          message: "로그인이 필요합니다.",
        },
        { status: 401 }
      );
    }

    // 3. 관리자 권한 확인
    const { data: adminData, error: adminError } =
      await supabase.rpc("is_admin");

    if (adminError || adminData !== true) {
      return NextResponse.json(
        {
          success: false,
          message: "관리자 권한이 필요합니다.",
        },
        { status: 403 }
      );
    }

    // 4. 실제 운영 환경 확인
    if (
      process.env.VERCEL_ENV !== "production" ||
      origin !== new URL(SITE_URL).origin
    ) {
      return NextResponse.json(
        {
          success: false,
          skipped: true,
          message:
            "실제 운영 환경에서만 IndexNow 제출이 가능합니다.",
        },
        { status: 403 }
      );
    }

    // 5. 변경 사항 기록
    // retry=1 요청은 기존 변경 사항만 재시도
    const isRetry =
      request.nextUrl.searchParams.get("retry") === "1";

    if (!isRetry) {
      const { error: markError } =
        await supabase.rpc("indexnow_mark_changed");

      if (markError) {
        console.error(
          "IndexNow 변경 기록 실패:",
          markError
        );

        return NextResponse.json(
          {
            success: false,
            message: "변경 사항 기록에 실패했습니다.",
          },
          { status: 500 }
        );
      }
    }

    // 6. 제출 가능 여부 확인 및 잠금
    const { data: claimData, error: claimError } =
      await supabase.rpc("indexnow_claim");

    if (claimError || !claimData) {
      console.error(
        "IndexNow 제출 잠금 실패:",
        claimError
      );

      return NextResponse.json(
        {
          success: false,
          message: "제출 상태 확인에 실패했습니다.",
        },
        { status: 500 }
      );
    }

    // 7. 제출할 필요가 없거나 제한된 경우
    if (claimData.claimed !== true) {
      let message = "IndexNow 제출이 보류되었습니다.";

      switch (claimData.reason) {
        case "no_pending":
          message = "제출할 변경 사항이 없습니다.";
          break;

        case "locked":
          message = "이미 IndexNow 제출이 진행 중입니다.";
          break;

        case "rate_limited":
          message = "제출 제한 시간이 지나면 재시도할 수 있습니다.";
          break;
      }

      return NextResponse.json({
        success: claimData.reason === "no_pending",
        skipped: true,
        reason: claimData.reason,
        retry_at: claimData.retry_at ?? null,
        message,
      });
    }

    // 8. 잠금 정보 확인
    const lockToken = claimData.lock_token;
    const changeVersion = claimData.change_version;

    if (
      typeof lockToken !== "string" ||
      typeof changeVersion !== "string" ||
      !/^\d+$/.test(changeVersion)
    ) {
      console.error("잘못된 IndexNow 잠금 정보");

      return NextResponse.json(
        {
          success: false,
          message: "제출 잠금 정보가 올바르지 않습니다.",
        },
        { status: 500 }
      );
    }

    // 9. IndexNow 제출 주소 생성
    const indexNowUrl = new URL(INDEXNOW_ENDPOINT);

    indexNowUrl.searchParams.set("url", SITE_URL);
    indexNowUrl.searchParams.set("key", INDEXNOW_KEY);
    indexNowUrl.searchParams.set(
      "keyLocation",
      `${SITE_URL}${INDEXNOW_KEY}.txt`
    );

    let submitStatus = 0;
    let submitError: string | null = null;

    // 10. 실제 IndexNow 서버 제출
    try {
      const response = await fetch(
        indexNowUrl.toString(),
        {
          method: "GET",
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        }
      );

      submitStatus = response.status;

      if (
        submitStatus !== 200 &&
        submitStatus !== 202
      ) {
        submitError =
          `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      // 네트워크 오류는 상태 코드 0으로 기록
      submitStatus = 0;
      submitError =
        error instanceof Error
          ? error.message
          : "IndexNow 네트워크 오류";
    }

    // 11. 제출 결과 저장 및 잠금 해제
    const { data: finishData, error: finishError } =
      await supabase.rpc("indexnow_finish", {
        p_lock_token: lockToken,
        p_change_version: changeVersion,
        p_status: submitStatus,
        p_error: submitError,
      });

    if (
      finishError ||
      !finishData ||
      finishData.finished !== true
    ) {
      console.error(
        "IndexNow 결과 저장 실패:",
        finishError ?? finishData
      );

      return NextResponse.json(
        {
          success: false,
          status: submitStatus,
          message:
            "IndexNow 제출 결과를 저장하지 못했습니다.",
        },
        { status: 500 }
      );
    }

    // 12. 제출 성공
    if (finishData.success === true) {
      return NextResponse.json({
        success: true,
        status: submitStatus,
        pending: finishData.pending,
        change_version: finishData.change_version,
        next_attempt_at: finishData.next_attempt_at,
        message:
          submitStatus === 202
            ? "IndexNow 요청 접수 완료 (키 검증 대기)"
            : "IndexNow 제출 완료",
        url: SITE_URL,
      });
    }

    // 13. 제출 실패 및 재시도 가능 시간 반환
    return NextResponse.json(
      {
        success: false,
        status: submitStatus,
        pending: finishData.pending,
        next_attempt_at: finishData.next_attempt_at,
        message:
          submitStatus === 429
            ? "요청 횟수 초과. 30분 후 재시도할 수 있습니다."
            : "IndexNow 제출 실패. 10분 후 재시도할 수 있습니다.",
      },
      {
        status: submitStatus === 429 ? 429 : 502,
      }
    );
  } catch (error) {
    // 14. 기타 예외 처리
    console.error("IndexNow API 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "IndexNow 요청 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}