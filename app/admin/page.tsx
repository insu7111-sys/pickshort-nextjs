
"use client";




import { useCallback, useEffect, useRef, useState } from "react";


import { createClient } from "@/utils/supabase/client";

export default function AdminPage() {
  const [category, setCategory] = useState("건강");
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [affiliateUrl, setAffiliateUrl] = useState("");

const [videoFile, setVideoFile] = useState<File | null>(null);

const [imageFile, setImageFile] = useState<File | null>(null);

const [productList, setProductList] = useState<any[]>([]);

const [authLoading, setAuthLoading] = useState(true);
const [isAdmin, setIsAdmin] = useState(false);

const [editingProductId, setEditingProductId] = useState<string | null>(null);

const [editTitle, setEditTitle] = useState("");
const [editCategory, setEditCategory] = useState("건강");
const [editDescription, setEditDescription] = useState("");
const [editAffiliateUrl, setEditAffiliateUrl] = useState("");

const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
const [editImageFile, setEditImageFile] = useState<File | null>(null);


const loadProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("상품 목록 불러오기 실패:", error.message);
    return;
  }

  setProductList(data ?? []);
};


useEffect(() => {
  if (authLoading || !isAdmin) {
    return;
  }

  loadProducts();
}, [authLoading, isAdmin]);



const supabase = createClient();

const [indexNowResult, setIndexNowResult] = useState<{
  success: boolean;
  skipped?: boolean;
  reason?: string;
  status?: number;
  pending?: boolean;
  retry_at?: string | null;
  next_attempt_at?: string | null;
  message: string;
} | null>(null);

const [indexNowRequests, setIndexNowRequests] = useState(0);
// IndexNow 저장 상태 관리
const [indexNowStatus, setIndexNowStatus] = useState<{
  success: boolean;
  found: boolean;
  pending: boolean;
  site_url: string;
  is_locked: boolean;
  is_rate_limited: boolean;
  last_status: number | null;
  last_error: string | null;
  last_attempt_at: string | null;
  last_success_at: string | null;
  next_attempt_at: string | null;
  locked_until: string | null;
  change_version: string;
  server_now: string;
  server_time: string;
} | null>(null);

const [indexNowStatusLoading, setIndexNowStatusLoading] =
  useState(true);

const [indexNowStatusError, setIndexNowStatusError] =
  useState("");

const [indexNowClock, setIndexNowClock] =
  useState(Date.now());

const [indexNowClockOffset, setIndexNowClockOffset] =
  useState(0);

const indexNowStatusRequestId = useRef(0);

// Supabase에 저장된 IndexNow 상태 불러오기
const loadIndexNowStatus = useCallback(async () => {
  const requestId = ++indexNowStatusRequestId.current;

  setIndexNowStatusLoading(true);
  setIndexNowStatusError("");

  try {
    const response = await fetch("/api/indexnow", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error(
        result.message ?? "IndexNow 상태 조회 실패"
      );
    }

    if (requestId !== indexNowStatusRequestId.current) {
      return;
    }

    const serverTime = Date.parse(
      result.server_now || result.server_time
    );

    const clientTime = Date.now();

    setIndexNowClockOffset(
      Number.isFinite(serverTime)
        ? serverTime - clientTime
        : 0
    );

    setIndexNowClock(clientTime);
    setIndexNowStatus(result);
  } catch (error) {
    if (requestId !== indexNowStatusRequestId.current) {
      return;
    }

    console.error("IndexNow 상태 조회 오류:", error);

    setIndexNowStatusError(
      error instanceof Error
        ? error.message
        : "IndexNow 상태 조회 중 오류가 발생했습니다."
    );
  } finally {
    if (requestId === indexNowStatusRequestId.current) {
      setIndexNowStatusLoading(false);
    }
  }
}, []);

// 관리자 로그인 후 저장 상태 자동 조회
useEffect(() => {
  if (authLoading || !isAdmin) {
    return;
  }

  void loadIndexNowStatus();

  return () => {
    indexNowStatusRequestId.current += 1;
  };
}, [authLoading, isAdmin, loadIndexNowStatus]);

// 재시도 카운트다운을 위한 1초 타이머
useEffect(() => {
  if (authLoading || !isAdmin) {
    return;
  }

  const timer = window.setInterval(() => {
    setIndexNowClock(Date.now());
  }, 1000);

  return () => window.clearInterval(timer);
}, [authLoading, isAdmin]);
const notifyIndexNow = async (isRetry = false) => {
  if (
    window.location.origin !==
    "https://pickshort-nextjs-y3hl.vercel.app"
  ) {
    setIndexNowResult({
      success: false,
      skipped: true,
      message: "실제 운영 사이트에서만 제출할 수 있습니다.",
    });
    return;
  }

  setIndexNowRequests((count) => count + 1);

  try {
    const response = await fetch(
      isRetry ? "/api/indexnow?retry=1" : "/api/indexnow",
      {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      }
    );

    const result = await response.json();

    setIndexNowResult({
      success: response.ok && result.success === true,
      skipped: result.skipped,
      reason: result.reason,
      status: result.status,
      pending: result.pending,
      retry_at: result.retry_at ?? null,
      next_attempt_at: result.next_attempt_at ?? null,
      message: result.message ?? "제출 결과를 확인해주세요.",
    });

    console.log("IndexNow 제출 결과:", result);
  } catch (error) {
    console.warn("IndexNow 제출 오류:", error);

    setIndexNowResult({
      success: false,
      message: "IndexNow 요청 중 오류가 발생했습니다.",
    });
   } finally {
    try {
      await loadIndexNowStatus();
    } finally {
      setIndexNowRequests((count) => Math.max(0, count - 1));
    }
  }
};


useEffect(() => {
  const checkAdmin = async () => {
    setAuthLoading(true);
    setIsAdmin(false);

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      setAuthLoading(false);
      return;
    }

    const { data: adminData, error: adminError } =
  await supabase.rpc("is_admin");

if (adminError) {
  console.error("관리자 권한 확인 실패:", adminError.message);
}

if (!adminError && adminData === true) {
  setIsAdmin(true);
}

    setAuthLoading(false);
  };

  checkAdmin();
}, []);

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    alert("로그아웃 실패: " + error.message);
    return;
  }

  window.location.href = "/login";
};

const handleAddProduct = async () => {
  if (!title.trim()) {
    alert("상품명을 입력해주세요.");
    

    return;
  }

  if (!affiliateUrl.trim()) {
    alert("쿠팡 파트너스 링크를 입력해주세요.");
    return;
  }

 
let videoUrl = "";

if (videoFile) {
  if (videoFile.type !== "video/mp4") {
    alert("MP4 영상만 업로드할 수 있습니다.");
    return;
  }

  const filePath = `${crypto.randomUUID()}.mp4`;

  const { error: uploadError } = await supabase.storage
    .from("product-videos")
    .upload(filePath, videoFile, {
      contentType: "video/mp4",
    });

  if (uploadError) {
    alert("영상 업로드 실패: " + uploadError.message);
    return;
  }

  const { data } = supabase.storage
    .from("product-videos")
    .getPublicUrl(filePath);

  videoUrl = data.publicUrl;
}

let imageUrl = "";

if (imageFile) {
  if (!imageFile.type.startsWith("image/")) {
    alert("이미지 파일만 업로드할 수 있습니다.");
    return;
  }

  const fileExtension = imageFile.name.split(".").pop()?.toLowerCase();

  if (!fileExtension) {
    alert("이미지 파일 확장자를 확인해주세요.");
    return;
  }

  const filePath = `${crypto.randomUUID()}.${fileExtension}`;

  const { error: imageUploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, imageFile, {
      contentType: imageFile.type,
    });

  if (imageUploadError) {
    alert("이미지 업로드 실패: " + imageUploadError.message);
    return;
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  imageUrl = data.publicUrl;
}

const { error } = await supabase.from("products").insert({
  id: crypto.randomUUID(),
  title: title.trim(),
  category: category,
  description: description.trim(),
  affiliate_url: affiliateUrl.trim(),

video_url: videoUrl,

image_url: imageUrl,

  tags: [],
  is_published: true,
});


if (error) {
  alert("상품 등록 실패: " + error.message);
  return;
}

// 실제 운영 사이트에서만 IndexNow 자동 제출
if (
  window.location.origin ===
  "https://pickshort-nextjs-y3hl.vercel.app"
) {
  void notifyIndexNow();
}



await loadProducts();

alert("상품이 성공적으로 등록되었습니다!");

;
};


const handleUpdateProduct = async () => {
  if (!editingProductId) {
    alert("수정할 상품을 선택해주세요.");
    return;
  }

  if (!editTitle.trim()) {
    alert("상품명을 입력해주세요.");
    return;
  }

  if (!editAffiliateUrl.trim()) {
    alert("쿠팡 파트너스 링크를 입력해주세요.");
    return;
  }

  const currentProduct = productList.find(
    (product) => product.id === editingProductId
  );

  if (!currentProduct) {
    alert("상품 정보를 찾을 수 없습니다.");
    return;
  }

  const updates: {
    title: string;
    category: string;
    description: string;
    affiliate_url: string;
    video_url?: string;
    image_url?: string;
  } = {
    title: editTitle.trim(),
    category: editCategory,
    description: editDescription.trim(),
    affiliate_url: editAffiliateUrl.trim(),
  };

  // 새 영상이 선택된 경우에만 업로드
  
  if (editVideoFile) {
    if (
      editVideoFile.type !== "video/mp4" ||
      !editVideoFile.name.toLowerCase().endsWith(".mp4")
    ) {
      alert("MP4 영상만 업로드할 수 있습니다.");
      return;
    }

    if (editVideoFile.size > 50 * 1024 * 1024) {
      alert("영상은 50MB 이하로 선택해주세요.");
      return;
    }

    const videoPath = `${crypto.randomUUID()}.mp4`;

    const { error: videoError } = await supabase.storage
      .from("product-videos")
      .upload(videoPath, editVideoFile, {
        contentType: "video/mp4",
      });

    if (videoError) {
      alert("영상 업로드 실패: " + videoError.message);
      return;
    }

    const { data: videoData } = supabase.storage
      .from("product-videos")
      .getPublicUrl(videoPath);

    updates.video_url = videoData.publicUrl;
  }

  // 새 이미지가 선택된 경우에만 업로드
  if (editImageFile) {
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedImageTypes.includes(editImageFile.type)) {
      alert("JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.");
      return;
    }

    const extension =
      editImageFile.type === "image/png"
        ? "png"
        : editImageFile.type === "image/webp"
          ? "webp"
          : "jpg";

    const imagePath = `${crypto.randomUUID()}.${extension}`;

    const { error: imageError } = await supabase.storage
      .from("product-images")
      .upload(imagePath, editImageFile, {
        contentType: editImageFile.type,
      });

    if (imageError) {
      alert("이미지 업로드 실패: " + imageError.message);
      return;
    }

    const { data: imageData } = supabase.storage
      .from("product-images")
      .getPublicUrl(imagePath);

    updates.image_url = imageData.publicUrl;
  }

// 기존 상품과 수정할 상품 정보 비교
const hasProductChanges =
  currentProduct.title !== updates.title ||
  currentProduct.category !== updates.category ||
  (currentProduct.description ?? "") !== updates.description ||
  currentProduct.affiliate_url !== updates.affiliate_url ||
  (
    updates.video_url !== undefined &&
    currentProduct.video_url !== updates.video_url
  ) ||
  (
    updates.image_url !== undefined &&
    currentProduct.image_url !== updates.image_url
  );

// 공개 상품의 정보가 변경된 경우에만 IndexNow 제출 대상
const shouldNotifyIndexNow =
  currentProduct.is_published === true &&
  hasProductChanges;

  // 상품 정보와 새 영상·이미지 주소 저장
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", editingProductId)
    .select("id");

  if (error) {
    alert("상품 수정 실패: " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    alert("상품이 수정되지 않았습니다. 관리자 권한을 확인해주세요.");
    return;
  }

// 공개 상품의 실제 변경 및 운영 사이트 여부 확인
if (
  shouldNotifyIndexNow &&
  window.location.origin ===
    "https://pickshort-nextjs-y3hl.vercel.app"
) {
  void notifyIndexNow();
}

  await loadProducts();

  setEditingProductId(null);
  setEditVideoFile(null);
  setEditImageFile(null);

  alert("상품 정보와 선택한 파일이 저장되었습니다!");
};




const handleDeleteProduct = async (productId: string) => {
  const confirmed = window.confirm(
    "정말 이 상품을 삭제하시겠습니까?\n삭제한 상품은 복구할 수 없습니다."
  );

  if (!confirmed) return;

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("id, video_url, image_url, is_published")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    alert("상품 정보를 불러오지 못했습니다.");
    return;
  }

  const getStoragePath = (
    url: string | null,
    bucket: string
  ) => {
    if (!url) return null;

    try {
      const parsedUrl = new URL(url);
      const marker = `/storage/v1/object/public/${bucket}/`;

      const index = parsedUrl.pathname.indexOf(marker);
      if (index === -1) return null;

      return decodeURIComponent(
        parsedUrl.pathname.slice(index + marker.length)
      );
    } catch {
      return null;
    }
  };

  const videoPath = getStoragePath(
    product.video_url,
    "product-videos"
  );

  const imagePath = getStoragePath(
    product.image_url,
    "product-images"
  );

  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .select("id");

  if (error) {
    alert("상품 삭제 실패: " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    alert("상품이 삭제되지 않았습니다.");
    return;
  }

// 공개 상품 삭제 성공 시 운영 사이트에서만 IndexNow 자동 제출
if (
  product.is_published === true &&
  window.location.origin ===
    "https://pickshort-nextjs-y3hl.vercel.app"
) {
  void notifyIndexNow();
}


  const cleanupFile = async (
    bucket: string,
    path: string | null,
    column: "video_url" | "image_url"
  ) => {
    if (!path) return null;

    const { data: remaining, error: checkError } =
      await supabase
        .from("products")
        .select(column)
        .not(column, "is", null);

    if (checkError) {
      return `${bucket}: 파일 사용 여부 확인 실패`;
    }

    
const fileIsUsed = (remaining ?? []).some((item) => {
  const url =
    column === "video_url"
      ? ("video_url" in item ? item.video_url : null)
      : ("image_url" in item ? item.image_url : null);

  return getStoragePath(url, bucket) === path;
});



    if (fileIsUsed) return null;

    const { error: removeError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (removeError) {
      return `${bucket}: ${removeError.message}`;
    }

    return null;
  };

  const cleanupErrors: string[] = [];

  const videoCleanupError = await cleanupFile(
    "product-videos",
    videoPath,
    "video_url"
  );

  if (videoCleanupError) {
    cleanupErrors.push(videoCleanupError);
  }

  const imageCleanupError = await cleanupFile(
    "product-images",
    imagePath,
    "image_url"
  );

  if (imageCleanupError) {
    cleanupErrors.push(imageCleanupError);
  }

  await loadProducts();

  if (cleanupErrors.length > 0) {
    alert(
      "상품 정보는 삭제되었습니다.\n" +
      "다만 일부 파일은 정리하지 못했습니다:\n" +
      cleanupErrors.join("\n")
    );
  } else {
    alert("상품이 삭제되었습니다. 연결된 파일 정리도 완료했습니다.");
  }
};


const handleTogglePublished = async (
  productId: string,
  currentStatus: boolean
) => {
  const newStatus = !currentStatus;

  const { data, error } = await supabase
    .from("products")
    .update({
      is_published: newStatus,
    })
    .eq("id", productId)
    .eq("is_published", currentStatus)
    .select("id");

  if (error) {
    alert("공개 상태 변경 실패: " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    await loadProducts();
    alert("공개 상태가 변경되지 않았습니다. 이미 변경되었거나 관리자 권한을 확인해야 합니다.");
    return;
  }

  // 상품 공개 상태 변경 성공 시 운영 사이트에서만 IndexNow 자동 제출
  if (
    window.location.origin ===
      "https://pickshort-nextjs-y3hl.vercel.app"
  ) {
    void notifyIndexNow();
  }

  await loadProducts();

  alert(
    newStatus
      ? "상품이 공개되었습니다!"
      : "상품이 비공개로 변경되었습니다!"
  );
};



// IndexNow 재시도 가능 시간 계산
const indexNowCurrentTime =
  indexNowClock + indexNowClockOffset;

const indexNowNextAttemptTime =
  indexNowStatus?.next_attempt_at
    ? Date.parse(indexNowStatus.next_attempt_at)
    : 0;

const indexNowLockedUntil =
  indexNowStatus?.locked_until
    ? Date.parse(indexNowStatus.locked_until)
    : 0;

const indexNowRemainingSeconds = Math.max(
  0,
  Math.ceil(
    (
      Math.max(
        indexNowNextAttemptTime,
        indexNowLockedUntil
      ) - indexNowCurrentTime
    ) / 1000
  )
);

const indexNowCountdown =
  String(
    Math.floor(indexNowRemainingSeconds / 60)
  ).padStart(2, "0") +
  ":" +
  String(
    indexNowRemainingSeconds % 60
  ).padStart(2, "0");

// 실제 운영 사이트 여부 확인
const isIndexNowProduction =
  typeof window !== "undefined" &&
  window.location.origin ===
    "https://pickshort-nextjs-y3hl.vercel.app";

// IndexNow 재시도 버튼 활성화 조건
const canRetryIndexNow =
  isIndexNowProduction &&
  !indexNowStatusLoading &&
  !indexNowStatusError &&
  indexNowRequests === 0 &&
  indexNowStatus?.found === true &&
  indexNowStatus?.pending === true &&
  indexNowRemainingSeconds === 0 &&
  (
    !indexNowStatus.is_locked ||
    (
      indexNowLockedUntil > 0 &&
      indexNowLockedUntil <= indexNowCurrentTime
    )
  );

// 한국 시간 표시
const formatIndexNowTime = (
  value?: string | null
) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour12: false,
  });
};
if (authLoading) {
  return (
    <main style={{ padding: 40, textAlign: "center" }}>
      <h2>🔐 관리자 권한 확인 중...</h2>
    </main>
  );
}

if (!isAdmin) {
  return (
    <main style={{ padding: 40, textAlign: "center" }}>
      <h2>🔒 관리자 전용 페이지입니다.</h2>
      <p>로그인한 관리자만 접근할 수 있습니다.</p>
      <a href="/">픽숏 홈페이지로 돌아가기</a>
    </main>
  );
}

return (
    <main
      style={{
        maxWidth: 700,
        margin: "40px auto",
        padding: 20,
        color: "#222",
        background: "#fff",
        borderRadius: 16,
      }}
    >
      <h1>🛒 픽숏 상품 관리</h1>

<button
  type="button"
  onClick={handleLogout}
  style={{
    padding: "10px 18px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: 20,
  }}
>
  🚪 로그아웃
</button>
<section
  style={{
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    background: "#f8fafc",
    color: "#111827",
  }}
>
  <h2 style={{ marginTop: 0 }}>
    🔍 IndexNow 검색엔진 제출 관리
  </h2>

  {indexNowStatusLoading && (
    <p style={{ color: "#2563eb" }}>
      저장된 제출 상태를 불러오는 중...
    </p>
  )}

  {indexNowStatusError && (
    <p style={{ color: "#dc2626" }}>
      상태 조회 오류: {indexNowStatusError}
    </p>
  )}

  <p>
    제출 상태:{" "}
    <strong
      style={{
        color: indexNowStatusError
          ? "#dc2626"
          : indexNowStatus?.pending
          ? "#d97706"
          : "#16a34a",
      }}
    >
      {indexNowRequests > 0
        ? "제출 진행 중..."
        : indexNowStatusLoading
        ? "상태 확인 중..."
        : indexNowStatusError
        ? "상태 조회 실패"
        : !indexNowStatus?.found
        ? "제출 기록 없음"
        : indexNowStatus.pending
        ? "🟡 미제출 변경 사항 있음"
        : indexNowStatus.last_status === 200 ||
          indexNowStatus.last_status === 202
        ? "🟢 제출 완료"
        : indexNowStatus.last_status === null
        ? "제출 기록 없음"
        : "마지막 제출 실패"}
    </strong>
  </p>

  <p>
    응답 코드:{" "}
    <strong>
      {indexNowStatus?.last_status != null
        ? `HTTP ${indexNowStatus.last_status}`
        : "-"}
    </strong>
  </p>

  <p>
    마지막 제출 시도:{" "}
    {formatIndexNowTime(
      indexNowStatus?.last_attempt_at
    )}
  </p>

  <p>
    마지막 제출 성공:{" "}
    {formatIndexNowTime(
      indexNowStatus?.last_success_at
    )}
  </p>

  <p>
    미제출 변경 사항:{" "}
    <strong>
      {indexNowStatus?.pending === true
        ? "있음"
        : indexNowStatus?.pending === false
        ? "없음"
        : "확인되지 않음"}
    </strong>
  </p>

  <p>
    제출 잠금 상태:{" "}
    {!indexNowStatus?.found
      ? "확인되지 않음"
      : indexNowStatus.is_locked &&
        (
          indexNowLockedUntil === 0 ||
          indexNowLockedUntil > indexNowCurrentTime
        )
      ? "잠금 중"
      : "해제"}
  </p>

  <p>
    다음 재시도 시간:{" "}
    {formatIndexNowTime(
      indexNowStatus?.next_attempt_at
    )}
  </p>

  <p>
    변경 버전:{" "}
    {indexNowStatus?.change_version ?? "-"}
  </p>

  <p>
    마지막 오류:{" "}
    {indexNowStatus?.found
      ? indexNowStatus.last_error || "없음"
      : "-"}
  </p>

  <div
    style={{
      background: "#e2e8f0",
      borderRadius: 10,
      padding: 16,
      textAlign: "center",
      marginTop: 16,
      marginBottom: 16,
    }}
  >
    <div style={{ fontSize: 14 }}>
      남은 대기 시간
    </div>

    <div
      style={{
        fontSize: 32,
        fontWeight: "bold",
        color: indexNowRemainingSeconds > 0
          ? "#d97706"
          : "#16a34a",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {indexNowStatus?.found &&
      !indexNowStatusError
        ? indexNowCountdown
        : "--:--"}
    </div>
  </div>

  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
    }}
  >
    <button
      type="button"
      disabled={
        indexNowStatusLoading ||
        indexNowRequests > 0
      }
      onClick={() => void loadIndexNowStatus()}
      style={{
        flex: "1 1 160px",
        padding: "12px 16px",
        background:
          indexNowStatusLoading ||
          indexNowRequests > 0
            ? "#9ca3af"
            : "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontWeight: "bold",
        cursor:
          indexNowStatusLoading ||
          indexNowRequests > 0
            ? "not-allowed"
            : "pointer",
      }}
    >
      🔄 상태 새로고침
    </button>

    <button
      type="button"
      disabled={!canRetryIndexNow}
      onClick={() => void notifyIndexNow(true)}
      style={{
        flex: "1 1 160px",
        padding: "12px 16px",
        background: canRetryIndexNow
          ? "#16a34a"
          : "#9ca3af",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontWeight: "bold",
        cursor: canRetryIndexNow
          ? "pointer"
          : "not-allowed",
      }}
    >
      {indexNowRequests > 0
        ? "제출 진행 중..."
        : "🔄 IndexNow 재시도"}
    </button>
  </div>

  <p
    style={{
      fontSize: 13,
      color: "#64748b",
      marginTop: 12,
    }}
  >
    {!isIndexNowProduction
      ? "실제 운영 사이트에서만 제출할 수 있습니다."
      : indexNowRequests > 0
      ? "제출 요청을 처리하고 있습니다."
      : indexNowStatusLoading
      ? "저장 상태를 확인하고 있습니다."
      : indexNowStatusError
      ? "상태 새로고침 후 다시 확인해주세요."
      : !indexNowStatus?.found
      ? "저장된 제출 기록이 없습니다."
      : !indexNowStatus.pending
      ? "제출할 변경 사항이 없습니다."
      : indexNowRemainingSeconds > 0
      ? "대기 시간이 지나면 재시도할 수 있습니다."
      : canRetryIndexNow
      ? "지금 재시도할 수 있습니다."
      : "현재 제출할 수 없습니다."}
  </p>

  {indexNowResult && (
    <p
      style={{
        fontSize: 13,
        color: "#475569",
        background: "#fff",
        padding: 10,
        borderRadius: 8,
        overflowWrap: "anywhere",
      }}
    >
      최근 요청 결과: {indexNowResult.message}
    </p>
  )}
</section>
      <p>새로운 쇼츠 상품을 등록하는 화면입니다.</p>

      <div style={{ display: "grid", gap: 16 }}>
        <label>
          상품명
          <input
  type="text"
  placeholder="상품명을 입력하세요"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  style={inputStyle}
/>
        </label>

        <label>
          카테고리
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
          >
            <option>건강</option>
            <option>미용</option>
            <option>생활</option>
            <option>가전·도구</option>
          </select>
        </label>

        <label>
          상품 설명
          <textarea
  placeholder="상품 설명을 입력하세요"
  rows={4}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  style={inputStyle}
/>
        </label>

        
<label>
  쇼츠 영상 (MP4)
  <input
    type="file"
    accept="video/mp4"
    onChange={(e) => {
      const file = e.target.files?.[0] ?? null;
      setVideoFile(file);
    }}
    style={inputStyle}
  />
</label>

<label>
  상품 이미지
  <input
    type="file"
    accept="image/*"

onChange={(e) => {
  const file = e.target.files?.[0] ?? null;
  setImageFile(file);
}}

    style={inputStyle}
  />
</label>
<label>
  쿠팡 파트너스 링크
  <input
    type="url"
    placeholder="https://link.coupang.com/..."
    value={affiliateUrl}
    onChange={(e) => setAffiliateUrl(e.target.value)}
    style={inputStyle}
  />
</label>


        
<button
  type="button"
  onClick={handleAddProduct}
  style={{
    padding: 14,
    background: "#ffcf33",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  상품 등록하기
</button>

      </div>

<section style={{ marginTop: 40 }}>
  <h2>📦 등록된 상품 목록</h2>

  <p>총 {productList.length}개의 상품</p>

  {productList.length === 0 ? (
    <p>등록된 상품이 없습니다.</p>
  ) : (
    <div style={{ display: "grid", gap: 16 }}>
      {productList.map((product) => (
        <div
          key={product.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            background: "#fafafa",
          }}
        >
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.title}
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          )}

          <h3>{product.title}</h3>

          <p>카테고리: {product.category}</p>

          <p>
            상태: {product.is_published ? "🟢 공개" : "⚪ 비공개"}
          </p>

<button
  type="button"
  onClick={() =>
    handleTogglePublished(
      product.id,
      product.is_published
    )
  }
  style={{
    padding: "10px 16px",
    background: product.is_published
      ? "#6b7280"
      : "#16a34a",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: 12,
  }}
>
  {product.is_published
    ? "⚪ 비공개로 변경"
    : "🟢 공개로 변경"}
</button>

          <p>
            영상: {product.video_url ? "등록됨" : "없음"}
          </p>

<button
  type="button"
  
onClick={() => {
  setEditingProductId(product.id);
  setEditTitle(product.title ?? "");
  setEditCategory(product.category ?? "건강");
  setEditDescription(product.description ?? "");
  setEditAffiliateUrl(product.affiliate_url ?? "");

setEditVideoFile(null);
setEditImageFile(null);

}}

  style={{
    padding: "10px 16px",
    background: "#ffcf33",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  ✏️ 수정하기
</button>

<button
  type="button"
  onClick={() => handleDeleteProduct(product.id)}
  style={{
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    marginLeft: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  🗑️ 삭제하기
</button>

{editingProductId === product.id && (
  <div
    style={{
      marginTop: 16,
      padding: 16,
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: 10,
      display: "grid",
      gap: 12,
    }}
  >
    <h3>✏️ 상품 정보 수정</h3>

    <label>
      상품명
      <input
        type="text"
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        style={inputStyle}
      />
    </label>

    <label>
      카테고리
      <select
        value={editCategory}
        onChange={(e) => setEditCategory(e.target.value)}
        style={inputStyle}
      >
        <option>건강</option>
        <option>미용</option>
        <option>생활</option>
        <option>가전·도구</option>
      </select>
    </label>

    <label>
      상품 설명
      <textarea
        rows={4}
        value={editDescription}
        onChange={(e) => setEditDescription(e.target.value)}
        style={inputStyle}
      />
    </label>

    <label>
      쿠팡 파트너스 링크
      <input
        type="url"
        value={editAffiliateUrl}
        onChange={(e) => setEditAffiliateUrl(e.target.value)}
        style={inputStyle}
      />
    </label>

    
  
<label>
  쇼츠 영상 교체 (MP4)
  <input
    type="file"
    accept="video/mp4"
    onChange={(e) => {
      setEditVideoFile(e.target.files?.[0] ?? null);
    }}
    style={inputStyle}
  />
</label>

<label>
  상품 이미지 교체
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      setEditImageFile(e.target.files?.[0] ?? null);
    }}
    style={inputStyle}
  />
</label>

<p style={{ fontSize: 13, color: "#666" }}>
  파일을 선택하지 않으면 기존 영상과 이미지가 유지됩니다.
</p>

<button
  type="button"
  onClick={handleUpdateProduct}
  style={{
    padding: 12,
    background: "#ffcf33",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  💾 수정 내용 저장
</button>


<button
  type="button"
  onClick={() => setEditingProductId(null)}
  style={{
    padding: 12,
    background: "#eee",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  }}
>
  취소
</button>

  </div>
)}


        </div>
      ))}
    </div>
  )}
</section>

    </main>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  boxSizing: "border-box" as const,
};

