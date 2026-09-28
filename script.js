// ============================================================
// 2ND INVITATION — PEACH-STYLE DRAFT
// ============================================================

const weddingDate = new Date("2027-08-22T12:10:00+09:00");

const calendarYear = 2027;
const calendarMonth = 7; // August (January = 0)
const calendarDay = 22;


// ============================================================
// GALLERY SETTINGS
// ============================================================

const GALLERY_BASE_PATH = "images/";
const GALLERY_PREFIX = "gallery";
const GALLERY_EXTENSION = ".jpg";

const MAX_GALLERY_IMAGES = 60;
const INITIAL_GALLERY_COUNT = 9;


// ============================================================
// D-DAY
// ============================================================

function updateDday() {

  const el = document.getElementById("dday");

  if (!el) return;

  const now = new Date();

  const diff = Math.ceil(
    (weddingDate - now) / 86400000
  );

  if (diff > 0) {

    el.textContent = `D-${diff}`;

  } else if (diff === 0) {

    el.textContent = "D-DAY";

  } else {

    el.textContent = `D+${Math.abs(diff)}`;

  }

}

updateDday();


// ============================================================
// CALENDAR
// ============================================================

function buildCalendar() {

  const root = document.getElementById("calendar");

  if (!root) return;

  root.innerHTML = "";


  // 요일
  ["S", "M", "T", "W", "T", "F", "S"].forEach(day => {

    const el = document.createElement("div");

    el.className = "cal-head";
    el.textContent = day;

    root.appendChild(el);

  });


  const start =
    new Date(
      calendarYear,
      calendarMonth,
      1
    ).getDay();


  const last =
    new Date(
      calendarYear,
      calendarMonth + 1,
      0
    ).getDate();


  // 빈 칸
  for (let i = 0; i < start; i++) {

    const blank =
      document.createElement("div");

    blank.className =
      "cal-day empty";

    root.appendChild(blank);

  }


  // 날짜
  for (let day = 1; day <= last; day++) {

    const el =
      document.createElement("div");

    el.className =
      `cal-day${day === calendarDay ? " selected" : ""}`;

    el.textContent = day;

    root.appendChild(el);

  }

}

buildCalendar();


// ============================================================
// COPY
// ============================================================

async function safeCopy(text, msg) {

  try {

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {

      await navigator.clipboard.writeText(text);

    } else {

      const ta =
        document.createElement("textarea");

      ta.value = text;

      ta.style.position = "fixed";
      ta.style.opacity = "0";

      document.body.appendChild(ta);

      ta.select();

      document.execCommand("copy");

      ta.remove();

    }

    alert(msg);

  } catch (e) {

    alert("복사에 실패했습니다.");

  }

}


function copyText(text) {

  safeCopy(
    text,
    "복사되었습니다."
  );

}


function copyAccount(text) {

  safeCopy(
    text,
    "계좌번호가 복사되었습니다."
  );

}


// ============================================================
// BGM
// ============================================================

const bgm =
  document.getElementById("bgm");

const musicToggle =
  document.getElementById("musicToggle");

let musicWanted = true;


async function tryPlayMusic() {

  if (!bgm || !musicWanted) return;

  try {

    await bgm.play();

    musicToggle?.classList.add(
      "playing"
    );

  } catch (e) {

    musicToggle?.classList.remove(
      "playing"
    );

  }

}


// 자동 재생 시도
tryPlayMusic();


// 모바일/브라우저 자동재생 차단 대응
[
  "touchstart",
  "pointerdown",
  "click"
].forEach(evt => {

  window.addEventListener(
    evt,
    () => {

      if (
        musicWanted &&
        bgm?.paused
      ) {

        tryPlayMusic();

      }

    },
    {
      once: true,
      passive: true
    }
  );

});


musicToggle?.addEventListener(
  "click",
  async e => {

    e.stopPropagation();

    if (!bgm) return;


    if (bgm.paused) {

      musicWanted = true;

      await tryPlayMusic();

    } else {

      musicWanted = false;

      bgm.pause();

      musicToggle.classList.remove(
        "playing"
      );

    }

  }
);


// ============================================================
// IMAGE FALLBACK
// ============================================================

document
  .querySelectorAll(".photo-fallback img")
  .forEach(img => {

    img.addEventListener(
      "error",
      () => {

        img.style.opacity = "0";


        // 중복 라벨 방지
        if (
          img.parentElement.querySelector(
            ".photo-error-label"
          )
        ) {

          return;

        }


        const label =
          document.createElement("span");

        label.className =
          "photo-error-label";

        label.textContent =
          "PHOTO";

        label.style.cssText = `
          position:absolute;
          inset:0;
          display:grid;
          place-items:center;
          color:#fff8;
          font-size:10px;
          letter-spacing:.2em;
        `;


        img.parentElement.style.position =
          "relative";

        img.parentElement.appendChild(
          label
        );

      }
    );

  });


// ============================================================
// GALLERY AUTO DISCOVERY
// ============================================================

const galleryGrid =
  document.getElementById("galleryGrid");


// HTML에서 galleryMore 또는 galleryMoreBtn 둘 다 지원
const galleryMore =
  document.getElementById("galleryMore") ||
  document.getElementById("galleryMoreBtn");


const modal =
  document.getElementById("galleryModal");

const modalImg =
  document.getElementById(
    "galleryModalImage"
  );

const modalCount =
  document.getElementById(
    "galleryCount"
  );

const closeBtn =
  document.getElementById(
    "galleryClose"
  );

const prevBtn =
  document.getElementById(
    "galleryPrev"
  );

const nextBtn =
  document.getElementById(
    "galleryNext"
  );


let galleryImages = [];

let shownCount =
  INITIAL_GALLERY_COUNT;

let currentIndex = 0;


// ============================================================
// 갤러리 이미지 경로
// ============================================================

function gallerySrc(i) {

  return (
    `${GALLERY_BASE_PATH}` +
    `${GALLERY_PREFIX}` +
    `${i}` +
    `${GALLERY_EXTENSION}`
  );

}


// ============================================================
// 이미지 존재 여부 확인
// ============================================================

function imageExists(src) {

  return new Promise(resolve => {

    const img = new Image();

    img.onload = () =>
      resolve(true);

    img.onerror = () =>
      resolve(false);


    // GitHub Pages 캐시 방지
    img.src =
      `${src}?v=${Date.now()}`;

  });

}


// ============================================================
// gallery1.jpg ~ 자동 검색
// ============================================================

async function discoverGallery() {

  if (!galleryGrid) return;


  const found = [];


  for (
    let i = 1;
    i <= MAX_GALLERY_IMAGES;
    i++
  ) {

    const src =
      gallerySrc(i);


    const exists =
      await imageExists(src);


    // 번호가 끊기면 종료
    if (!exists) break;


    found.push(src);

  }


  galleryImages = found;


  renderGallery();

}


// ============================================================
// GALLERY RENDER
// ============================================================

function renderGallery() {

  if (!galleryGrid) return;


  galleryGrid.innerHTML = "";


  // 사진이 없을 경우
  if (!galleryImages.length) {

    galleryGrid.innerHTML = `
      <p
        style="
          grid-column:1/-1;
          color:#aaa;
          font-size:11px;
          line-height:1.7;
          text-align:center;
        "
      >
        images/gallery1.jpg부터
        사진을 넣어주세요.
      </p>
    `;


    if (galleryMore) {

      galleryMore.style.display =
        "none";

    }


    return;

  }


  // 현재 보여줄 사진
  galleryImages
    .slice(0, shownCount)
    .forEach((src, i) => {

      const btn =
        document.createElement(
          "button"
        );


      btn.type = "button";

      btn.className =
        "gallery-item";


      const img =
        document.createElement(
          "img"
        );


      img.src = src;

      img.alt =
        `웨딩 갤러리 ${i + 1}`;

      img.loading = "lazy";


      btn.appendChild(img);


      btn.addEventListener(
        "click",
        () => {

          openGallery(i);

        }
      );


      galleryGrid.appendChild(
        btn
      );

    });


  // 더보기 버튼
  if (galleryMore) {

    if (
      galleryImages.length <=
      INITIAL_GALLERY_COUNT
    ) {

      galleryMore.style.display =
        "none";

    } else {

      galleryMore.style.display =
        "block";


      galleryMore.textContent =
        shownCount >=
        galleryImages.length
          ? "접기"
          : "더보기";

    }

  }

}


// ============================================================
// 더보기 / 접기
// ============================================================

galleryMore?.addEventListener(
  "click",
  () => {

    const isExpanded =
      shownCount >=
      galleryImages.length;


    if (isExpanded) {

      // 다시 9장으로
      shownCount =
        INITIAL_GALLERY_COUNT;

    } else {

      // 전체 사진 표시
      shownCount =
        galleryImages.length;

    }


    renderGallery();

  }
);


// ============================================================
// GALLERY MODAL OPEN
// ============================================================

function openGallery(i) {

  if (
    !modal ||
    !modalImg ||
    !galleryImages.length
  ) {

    return;

  }


  currentIndex = i;


  updateModal();


  modal.hidden = false;

  modal.classList.add(
    "active"
  );


  document.body.style.overflow =
    "hidden";

}


// ============================================================
// MODAL IMAGE UPDATE
// ============================================================

function updateModal() {

  if (
    !galleryImages.length ||
    !modalImg
  ) {

    return;

  }


  modalImg.src =
    galleryImages[
      currentIndex
    ];


  if (modalCount) {

    modalCount.textContent =
      `${currentIndex + 1} / ${galleryImages.length}`;

  }

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeGallery() {

  if (!modal) return;


  modal.classList.remove(
    "active"
  );


  modal.hidden = true;


  document.body.style.overflow =
    "";

}


// ============================================================
// PREVIOUS IMAGE
// ============================================================

function prevGallery() {

  if (!galleryImages.length) return;


  currentIndex =
    (
      currentIndex -
      1 +
      galleryImages.length
    ) %
    galleryImages.length;


  updateModal();

}


// ============================================================
// NEXT IMAGE
// ============================================================

function nextGallery() {

  if (!galleryImages.length) return;


  currentIndex =
    (
      currentIndex + 1
    ) %
    galleryImages.length;


  updateModal();

}


// ============================================================
// MODAL BUTTON EVENTS
// ============================================================

closeBtn?.addEventListener(
  "click",
  closeGallery
);


prevBtn?.addEventListener(
  "click",
  e => {

    e.stopPropagation();

    prevGallery();

  }
);


nextBtn?.addEventListener(
  "click",
  e => {

    e.stopPropagation();

    nextGallery();

  }
);


// 배경 클릭 시 닫기
modal?.addEventListener(
  "click",
  e => {

    if (e.target === modal) {

      closeGallery();

    }

  }
);


// ============================================================
// KEYBOARD CONTROL
// ============================================================

document.addEventListener(
  "keydown",
  e => {

    if (
      !modal?.classList.contains(
        "active"
      )
    ) {

      return;

    }


    if (e.key === "Escape") {

      closeGallery();

    }


    if (e.key === "ArrowLeft") {

      prevGallery();

    }


    if (e.key === "ArrowRight") {

      nextGallery();

    }

  }
);


// ============================================================
// MOBILE SWIPE
// ============================================================

let touchStartX = 0;
let touchStartY = 0;


modal?.addEventListener(
  "touchstart",
  e => {

    touchStartX =
      e.changedTouches[0].clientX;

    touchStartY =
      e.changedTouches[0].clientY;

  },
  {
    passive: true
  }
);


modal?.addEventListener(
  "touchend",
  e => {

    const touchEndX =
      e.changedTouches[0].clientX;

    const touchEndY =
      e.changedTouches[0].clientY;


    const distanceX =
      touchStartX -
      touchEndX;

    const distanceY =
      touchStartY -
      touchEndY;


    // 세로 스크롤로 판단되면 무시
    if (
      Math.abs(distanceY) >
      Math.abs(distanceX)
    ) {

      return;

    }


    // 너무 짧은 스와이프 무시
    if (
      Math.abs(distanceX) <
      50
    ) {

      return;

    }


    // 왼쪽으로 밀기
    // → 다음 사진
    if (distanceX > 0) {

      nextGallery();

    }

    // 오른쪽으로 밀기
    // → 이전 사진
    else {

      prevGallery();

    }

  },
  {
    passive: true
  }
);


// ============================================================
// GALLERY START
// ============================================================

discoverGallery();


// ============================================================
// SHARE
// ============================================================

document
  .getElementById(
    "shareButton"
  )
  ?.addEventListener(
    "click",
    async () => {

      const shareData = {

        title:
          "이인원 ♥ 김지윤 결혼합니다",

        text:
          "2027.08.22 SUN 12:10 PM · 라마다서울신도림호텔 세인트 그레이스 홀",

        url:
          location.href

      };


      try {

        if (
          navigator.share
        ) {

          await navigator.share(
            shareData
          );

        } else {

          await safeCopy(
            location.href,
            "청첩장 주소가 복사되었습니다."
          );

        }

      } catch (e) {

        // 공유 취소 시 아무 동작 안 함

      }

    }
  );
