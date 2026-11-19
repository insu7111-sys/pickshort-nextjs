
"use client";




import { useEffect, useState } from "react";


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

    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!adminError && adminData) {
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

  const { data, error } = await supabase
    .from("products")
    .update({
      title: editTitle.trim(),
      category: editCategory,
      description: editDescription.trim(),
      affiliate_url: editAffiliateUrl.trim(),
    })
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

  await loadProducts();
  setEditingProductId(null);

  alert("상품 정보가 성공적으로 수정되었습니다!");
};


const handleDeleteProduct = async (productId: string) => {
  const confirmed = window.confirm(
    "정말 이 상품을 삭제하시겠습니까?\n삭제한 상품은 복구할 수 없습니다."
  );

  if (!confirmed) {
    return;
  }

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
    alert("상품이 삭제되지 않았습니다. 관리자 권한을 확인해주세요.");
    return;
  }

  alert("상품이 성공적으로 삭제되었습니다!");

  await loadProducts();
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
    .select("id");

  if (error) {
    alert("공개 상태 변경 실패: " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    alert("공개 상태가 변경되지 않았습니다. 관리자 권한을 확인해주세요.");
    return;
  }

  await loadProducts();

  alert(
    newStatus
      ? "상품이 공개되었습니다!"
      : "상품이 비공개로 변경되었습니다!"
  );
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

