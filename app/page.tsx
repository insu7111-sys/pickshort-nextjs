
"use client";


import { useMemo, useState, useEffect, useRef } from "react";

import products from "../data/products.json";

type Product = {
  id: string;
  category: string;
  title: string;
  description: string;
  name: string;
  priceLabel: string;
  emoji: string;
  background: string;
  videoUrl: string;
  imageUrl?: string;
  affiliateUrl: string;
  tags: string[];
};


const categories = [
  "전체",
  "건강",
  "미용",
  "생활",
  "가전·도구",
  "❤️ 찜한 상품",
];


const hasAffiliate = (url: string) =>
  Boolean(
    url &&
    url !== "PASTE_YOUR_COUPANG_PARTNERS_LINK_HERE" &&
    /^https?:\/\//i.test(url)
  );



function AutoPlayVideo({
  src,
  poster,
  name,
  productId,
}: {
  src: string;
  poster?: string;
  name: string;
  productId: string;

}) {
  const videoRef = useRef<HTMLVideoElement>(null);


const [isMuted, setIsMuted] = useState(true);

useEffect(() => {
  const savedSound = localStorage.getItem("pickshort-sound");

  if (savedSound === "on") {
    setIsMuted(false);
  }
}, []);

const [isLiked, setIsLiked] = useState(false);

const [likesLoaded, setLikesLoaded] = useState(false);

useEffect(() => {
  try {
    const savedLikes = JSON.parse(
      localStorage.getItem("pickshort-likes") || "[]"
    );

    setIsLiked(
      Array.isArray(savedLikes) &&
      savedLikes.includes(productId)
    );
  } catch {
    setIsLiked(false);
  }

  setLikesLoaded(true);
}, [productId]);

const toggleLike = () => {
  if (!likesLoaded) return;

  const nextLiked = !isLiked;

  try {
    const saved = JSON.parse(
      localStorage.getItem("pickshort-likes") || "[]"
    );

    const savedLikes: string[] = Array.isArray(saved)
      ? saved.filter((id): id is string => typeof id === "string")
      : [];

    const updatedLikes = nextLiked
      ? Array.from(new Set([...savedLikes, productId]))
      : savedLikes.filter((id) => id !== productId);

    localStorage.setItem(
      "pickshort-likes",
      JSON.stringify(updatedLikes)
    );

    setIsLiked(nextLiked);

window.dispatchEvent(new Event("pickshort-likes-updated"));

  } catch {
    alert("좋아요 저장에 실패했습니다. 브라우저 저장소 설정을 확인해 주세요.");
  }
};


const shareVideo = async () => {
  const url = window.location.href;

  try {
    if (navigator.share) {
      await navigator.share({
        title: name,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert("픽숏 사이트 주소가 복사되었습니다.");
    }
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      return;
    }

    alert("공유에 실패했습니다. 다시 시도해 주세요.");
  }
};

// 소리 켜기 / 끄기 버튼
const toggleSound = () => {
  const video = videoRef.current;
  if (!video) return;

  const nextMuted = !video.muted;

  video.muted = nextMuted;
  setIsMuted(nextMuted);

  localStorage.setItem(
    "pickshort-sound",
    nextMuted ? "off" : "on"
  );

  if (!nextMuted) {
    video.play().catch(() => {
      // 브라우저가 재생을 차단하면 사용자 조작을 기다립니다.
    });
  }
};

// 영상 자동재생 관리
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  // 모든 쇼츠 영상 중 하나만 재생
  const updatePlayback = () => {
      const videos = Array.from(
        document.querySelectorAll<HTMLVideoElement>(
          ".videoFrame video.video"
        )
      );

      let bestVideo: HTMLVideoElement | null = null;
      let bestRatio = 0;

      videos.forEach((item) => {
        const rect = item.getBoundingClientRect();

        const visibleHeight = Math.max(
          0,
          Math.min(rect.bottom, window.innerHeight) -
            Math.max(rect.top, 0)
        );

        const ratio =
          rect.height > 0
            ? visibleHeight / rect.height
            : 0;

        if (ratio >= 0.5 && ratio > bestRatio) {
          bestRatio = ratio;
          bestVideo = item;
        }
      });

      videos.forEach((item) => {
        if (item === bestVideo) {
          if (item.paused) {
            item.play().catch(() => {});
          }
        } else {
          if (!item.paused) {
            item.pause();
          }
        }
      });
    };

    // 스크롤하거나 화면 크기가 바뀔 때 확인
    window.addEventListener("scroll", updatePlayback, {
      passive: true,
    });
    window.addEventListener("resize", updatePlayback);

    // 처음 화면에 나타났을 때 확인
    const observer = new IntersectionObserver(
      updatePlayback,
      { threshold: [0, 0.5, 1] }
    );

    observer.observe(video);
    updatePlayback();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updatePlayback);
      window.removeEventListener("resize", updatePlayback);
      video.pause();
    };
  }, []);

  
return (
  <div
    style={{
      position: "relative",
      width: "100%",
      height: "100%",
    }}
  >
    <video
      ref={videoRef}
      className="video"
      src={src}
      poster={poster}
      controls
      playsInline
      muted={isMuted}
      loop
      preload="metadata"
      aria-label={`${name} 소개 영상`}
    />

    
<div
  className="shortActionGroup"
  style={{
    position: "absolute",
    right: "12px",
    bottom: "-60px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "10px",
    zIndex: 50,
  }}
>

  <button
    className="shortLikeButton"
    type="button"
    onClick={toggleLike}
    aria-label={isLiked ? "좋아요 취소" : "좋아요"}
    aria-pressed={isLiked}
    style={{
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      border: "2px solid #ffcf33",
      background: "rgba(0,0,0,0.75)",
      color: "#ffffff",
      fontSize: "22px",
      cursor: "pointer",
    }}
  >
    {isLiked ? "❤️" : "🤍"}
  </button>

  <button
    className="shortShareButton"
    type="button"
    onClick={shareVideo}
    aria-label="영상 공유하기"
    title="공유하기"
    style={{
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      border: "2px solid #ffcf33",
      background: "rgba(0,0,0,0.75)",
      color: "#ffffff",
      fontSize: "22px",
      cursor: "pointer",
    }}
  >
    ↗
  </button>

  <button
    className="shortSoundButton"
    type="button"
    onClick={toggleSound}
    aria-label={isMuted ? "소리 켜기" : "소리 끄기"}
    title={isMuted ? "소리 켜기" : "소리 끄기"}
    style={{
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      border: "2px solid #ffcf33",
      background: "rgba(0,0,0,0.75)",
      color: "#ffffff",
      fontSize: "22px",
      cursor: "pointer",
    }}
  >
    
    {isMuted ? "🔇" : "🔊"}
  </button>
</div>
</div>
);
}



export default function Home() {
  const [category, setCategory] = useState("전체");
  const [search, setSearch] = useState("");

const [likedIds, setLikedIds] = useState<string[]>([]);

useEffect(() => {
  const loadLikes = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("pickshort-likes") || "[]"
      );

      setLikedIds(
        Array.isArray(saved)
          ? saved.filter(
              (id): id is string => typeof id === "string"
            )
          : []
      );
    } catch {
      setLikedIds([]);
    }
  };

  loadLikes();

  window.addEventListener("pickshort-likes-updated", loadLikes);
  window.addEventListener("storage", loadLikes);

  return () => {
    window.removeEventListener("pickshort-likes-updated", loadLikes);
    window.removeEventListener("storage", loadLikes);
  };
}, []);

  const items = products as Product[];

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();

    return items.filter((p) => {
      
const categoryMatch =
  category === "전체" ||
  (category === "❤️ 찜한 상품"
    ? likedIds.includes(p.id)
    : p.category === category);

      const text = [
        p.title,
        p.description,
        p.name,
        p.category,
        ...(p.tags || []),
      ]
        .join(" ")
        .toLocaleLowerCase();

      return categoryMatch && (!q || text.includes(q));
    });
  
}, [category, search, items, likedIds]);


  return (
    <main>
      <header className="topbar">
        <a className="logo" href="/" aria-label="픽숏 홈">
          픽<span>숏</span>
        </a>

        <label className="searchbox">
          <span className="srOnly">상품 검색</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="상품 또는 키워드 검색"
          />
          <span className="searchIcon" aria-hidden="true">
            ⌕
          </span>
        </label>
      </header>

      <div className="container">
        <section className="hero">
          <div>
            <div className="eyebrow">PICK · WATCH · SHOP</div>
            <h1>
              짧게 보고,
              <br className="mobileBreak" /> 똑똑하게 쇼핑
            </h1>
            <p>
              건강·미용·생활·가전 도구 아이템을
              숏츠처럼 만나보세요.
            </p>
          </div>

          <aside className="disclosure">
            <strong>쿠팡 파트너스 제휴 안내</strong>
            <p>
              이 페이지는 쿠팡 파트너스 활동의 일환으로,
              이에 따른 일정액의 수수료를 제공받습니다.
            </p>
          </aside>
        </section>

        
<nav className="categories" aria-label="상품 카테고리">
  {categories.map((c) => (
    <button
      key={c}
      className={
        category === c
          ? "category active"
          : "category"
      }
      onClick={() => setCategory(c)}
    >
      {c === "❤️ 찜한 상품"
        ? `❤️ 찜한 상품 (${likedIds.length})`
        : c}
    </button>
  ))}
</nav>


        <div className="layout">
          <section className="feed" aria-label="추천 상품 숏츠">
            {filtered.length ? (
              filtered.map((p) => (
                <article className="shortCard" key={p.id}>
                  <div
                    className="videoFrame"
                    style={{
                      background: p.background,
                      position: "relative",
                    }}
                  >
                    {p.videoUrl ? (
                      

<AutoPlayVideo
  src={p.videoUrl}
  poster={p.imageUrl || undefined}
  name={p.name}
  productId={p.id}
/>



                    ) : p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="posterImage"
                        src={p.imageUrl}
                        alt={p.name}
                      />
                    ) : (
                      <div className="placeholder">
                        <span
                          className="productEmoji"
                          aria-hidden="true"
                        >
                          {p.emoji}
                        </span>
                        <span className="placeholderLabel">
                          영상 URL을 등록하세요
                        </span>
                      </div>
                    )}

                    <span className="tag">
                      {p.category} 추천
                    </span>

                    {/* 왼쪽 중간 쇼핑 상품 이미지 */}
                    {p.imageUrl &&
                      hasAffiliate(p.affiliateUrl) && (
                        <a
                          href={p.affiliateUrl}
                          target="_blank"
                          rel="sponsored nofollow noopener noreferrer"
                          aria-label={`${p.name} 쿠팡 쇼핑하기`}
                          style={{
                            position: "absolute",
                            left: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 20,
                            width: "76px",
                            padding: "5px",
                            background: "#ffffff",
                            border: "2px solid #ffcf33",
                            borderRadius: "12px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                            textDecoration: "none",
                            boxShadow:
                              "0 4px 14px rgba(0,0,0,0.35)",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{
                              width: "70px",
                              height: "70px",
                              objectFit: "contain",
                              borderRadius: "6px",
                            }}
                          />
                          <span
                            style={{
                              color: "#111",
                              fontSize: "11px",
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                            }}
                          >
                            🛒 쇼핑하기
                          </span>
                        </a>
                      )}

                    

                    <div className="videoCaption">
                      <h2>{p.title}</h2>
                      <p>{p.description}</p>
                    </div>
                  </div>

                  <div className="productInfo">
                    <div className="productName">
                      {p.name}
                    </div>

                    <div className="productMeta">
                      <span className="price">
                        {p.priceLabel || "가격 확인"}
                      </span>

                      {hasAffiliate(p.affiliateUrl) ? (
                        <a
                          className="buyButton"
                          href={p.affiliateUrl}
                          target="_blank"
                          rel="sponsored nofollow noopener noreferrer"
                        >
                          쿠팡에서 보기 ↗
                        </a>
                      ) : (
                        <button
                          className="buyButton disabled"
                          disabled
                          title="data/products.json에 제휴 링크를 입력하세요"
                        >
                          링크 등록 필요
                        </button>
                      )}
                    </div>

                    <p className="finePrint">
                      상품 옵션·가격·배송 정보는 쿠팡
                      상품 페이지에서 확인하세요.
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty">
                검색 결과가 없습니다.
                다른 키워드로 검색해 보세요.
              </div>
            )}
          </section>

          <aside className="sidebar">
            <section className="sideBox">
              <h3>콘텐츠 제작 순서</h3>

              <div className="step">
                <b>1</b>
                <div>
                  <strong>문제 상황 보여주기</strong>
                  <p>
                    시청자가 공감할 일상 속 불편을
                    짧게 제시합니다.
                  </p>
                </div>
              </div>

              <div className="step">
                <b>2</b>
                <div>
                  <strong>상품 사용 장면</strong>
                  <p>
                    직접 촬영했거나 사용 허가를 받은
                    영상으로 장점을 설명합니다.
                  </p>
                </div>
              </div>

              <div className="step">
                <b>3</b>
                <div>
                  <strong>상품 링크 연결</strong>
                  <p>
                    쿠팡 파트너스에서 발급받은
                    정확한 제휴 링크를 연결합니다.
                  </p>
                </div>
              </div>
            </section>

            <section className="sideBox">
              <h3>운영 전 체크리스트</h3>
              <ul className="checklist">
                <li>실제 제휴 링크 입력</li>
                <li>가격·상품 정보 확인</li>
                <li>제휴 고지 표시</li>
                <li>영상·이미지 사용 권한 확인</li>
                <li>쿠팡 파트너스에 운영 사이트 등록</li>
              </ul>
            </section>
          </aside>
        </div>

        <footer className="footer">
          <p>
            상품 정보는 구매 전 쿠팡의 최신 안내를
            확인해 주세요. 가격과 판매 조건은
            변경될 수 있습니다.
          </p>
          <p>© 픽숏 · 쇼핑 숏츠 데모</p>
        </footer>
      </div>
    </main>
  );
}
