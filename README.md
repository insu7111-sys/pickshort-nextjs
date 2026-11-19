# 픽숏(PickShort) — 쿠팡 파트너스 숏츠 웹사이트

숏츠 영상, 상품 검색, 카테고리 필터, 쿠팡 제휴 링크를 제공하는 Next.js 데모입니다.

## 1. 준비물
- Node.js LTS 설치: https://nodejs.org/
- GitHub 계정(인터넷 공개 배포에 권장)
- 쿠팡 파트너스 계정 및 직접 발급받은 제휴 링크

## 2. 로컬에서 실행하기
프로젝트 폴더에서 터미널/명령 프롬프트를 열고 실행합니다.

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

## 3. 상품 추가 및 수정
`data/products.json` 파일을 편집합니다. 각 상품은 아래 필드를 사용합니다.

- `id`: 상품별 고유 ID
- `category`: 주방 / 생활 / 디지털 / 정리 중 하나
- `title`: 영상에 표시할 짧은 제목
- `description`: 영상 설명
- `name`: 상품명
- `priceLabel`: 가격 표시. 가격이 자주 변하면 `가격 확인`처럼 표시 권장
- `emoji`: 영상이 없을 때 표시할 대체 아이콘
- `background`: 대체 화면 배경 CSS
- `videoUrl`: 공개적으로 재생 가능한 mp4 영상 URL 또는 `/videos/example.mp4`
- `imageUrl`: 선택 사항인 이미지 또는 영상 포스터 URL
- `affiliateUrl`: 쿠팡 파트너스에서 생성한 제휴 링크
- `tags`: 검색용 키워드 배열

`affiliateUrl`의 `PASTE_YOUR_COUPANG_PARTNERS_LINK_HERE`를 본인이 발급한 링크로 바꾸세요. 일반 쿠팡 상품 URL을 그대로 붙여 넣는 대신 파트너스에서 생성한 링크를 사용하세요.

## 4. 영상 등록
- 직접 촬영했거나 사용 권한이 있는 영상만 사용하세요.
- mp4 파일을 `public/videos/` 폴더에 넣고 `videoUrl`을 `/videos/파일명.mp4`로 지정할 수 있습니다.
- 큰 영상 파일이 많으면 외부 영상 호스팅/CDN을 이용하는 것이 좋습니다.
- 외부 영상 URL은 사이트에서 재생 가능한 공개 URL이어야 하며, 임의의 YouTube 페이지 URL이 HTML video에서 바로 재생되는 것은 아닙니다.

## 5. Vercel로 인터넷 공개하기
가장 쉬운 방법은 GitHub와 Vercel을 연결하는 것입니다.

1. GitHub에서 새 저장소를 만듭니다.
2. 이 프로젝트 파일 전체를 저장소에 업로드/푸시합니다.
3. https://vercel.com/ 에서 가입 후 GitHub를 연결합니다.
4. `Add New` → `Project`에서 저장소를 Import합니다.
5. Framework Preset이 Next.js인지 확인하고 Deploy를 누릅니다.
6. 배포가 끝나면 `https://프로젝트이름.vercel.app` 형태의 공개 주소가 발급됩니다.
7. 수정 후 GitHub에 다시 올리면 연결된 프로젝트가 재배포됩니다.

또는 PC에 Node.js와 Git이 설치되어 있으면 터미널에서 다음을 실행할 수 있습니다.

```bash
npm install
npm run build
npm install -g vercel
vercel
vercel --prod
```

## 6. 쿠팡 파트너스 운영 전 확인
- 실제 사이트 URL을 쿠팡 파트너스 활동 채널로 등록하고, 최신 이용약관/운영정책을 확인하세요.
- 제휴 링크가 있는 페이지에 경제적 이해관계 표시를 방문자가 쉽게 볼 수 있게 유지하세요.
- 영상 안에서 상품을 소개하는 경우 영상 자체에도 고지를 넣는 방안을 검토하세요.
- 가격, 할인율, 재고, 배송일은 변동될 수 있습니다. 검증하지 않은 수치나 효능을 단정하지 마세요.
- 상품 이미지와 동영상은 사용 권한이 있는 자료를 사용하세요.
- 쿠팡 파트너스 API 자동 검색/가격 연동은 포함되어 있지 않습니다. 승인된 API 사용 권한과 현재 공식 문서 확인 후 별도로 구현해야 합니다.
- 이 데모에는 관리자 로그인이나 DB가 없습니다. 공개 후 JSON 파일을 수정하려면 프로젝트를 다시 배포해야 합니다.

공식 참고:
- 쿠팡 파트너스: https://partners.coupang.com/
- Next.js 배포 문서: https://nextjs.org/docs/app/getting-started/deploying
- Vercel Next.js 문서: https://vercel.com/docs/frameworks/nextjs


## 7. 상품을 누르면 쿠팡으로 연결하기
각 상품 영상 위의 노란색 `🛒 상품 보러가기` 버튼과 아래 `쿠팡에서 보기` 버튼은 `data/products.json`에 입력한 제휴 링크로 연결됩니다.

1. [쿠팡 파트너스](https://partners.coupang.com/)에 로그인합니다.
2. 소개할 상품을 선택하고 상품 링크를 생성합니다. 또는 `링크 생성 → 간편 링크 만들기`에서 쿠팡 상품 URL을 제휴 링크로 변환합니다.
3. `data/products.json` 파일에서 해당 상품의 `affiliateUrl` 값을 발급받은 링크로 바꿉니다.
4. 저장한 뒤 다시 배포하면 버튼이 쿠팡 상품 페이지로 이동합니다.

예시:
```json
"affiliateUrl": "https://link.coupang.com/a/실제발급받은링크"
```
위 URL은 형식 예시일 뿐이므로 실제로 발급받은 본인의 링크를 넣어야 합니다. 링크가 등록되지 않은 샘플 상품은 구매 버튼이 연결되지 않습니다.

**중요:** 이 프로젝트는 링크 연결 기능을 구현한 샘플이며, 쿠팡 파트너스 계정이나 실제 제휴 링크를 자동으로 생성하지 않습니다. 광고 대상 사이트/채널을 등록하고 최신 쿠팡 파트너스 정책을 확인하세요.
