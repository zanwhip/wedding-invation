
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Playfair_Display, Lora } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "700"] });
const lora = Lora({ subsets: ["latin"], weight: ["400", "500"] });

/**
 * Full single-file wedding invitation page
 * - Uses images from /public/images/*.jpeg and letter.jpg
 * - Features:
 *   * Opening letter modal (click to open) -> plays music
 *   * Hero (full 100vh) with overlay, fade/zoom image, slide-up text
 *   * Details section with parallax and countdown + "View Map"
 *   * Notes section (image + small guidelines)
 *   * Gallery (simple swipe slider for mobile + buttons desktop) with gentle zoom on slide
 *   * RSVP form (modal) with short form and heart animation on success
 *   * Final section with subtle fireworks (CSS) and looping background image
 *   * Floating petals/bubbles background animation
 *
 * Requires TailwindCSS in the project and Framer Motion available.
 */

/* ---------------------------- Floating decor ---------------------------- */
function FloatingDecor() {
  useEffect(() => {
    const root = document.getElementById("floating-decor");
    if (!root) return;
    // create falling items
    const items: HTMLDivElement[] = [];
    for (let i = 0; i < 22; i++) {
      const el = document.createElement("div");
      el.className = "floating-item";
      el.style.left = `${Math.random() * 100}vw`;
      el.style.animationDuration = `${8 + Math.random() * 8}s`;
      el.style.animationDelay = `${Math.random() * 6}s`;
      el.style.opacity = `${0.6 + Math.random() * 0.4}`;
      root.appendChild(el);
      items.push(el);
    }
    return () => items.forEach((i) => i.remove());
  }, []);
  return <div id="floating-decor" className="pointer-events-none fixed inset-0 z-40" />;
}

/* ---------------------------- Countdown hook ---------------------------- */
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = Math.max(0, targetDate.getTime() - Date.now());
    return diff;
  });
  useEffect(() => {
    const t = setInterval(() => {
      const diff = Math.max(0, targetDate.getTime() - Date.now());
      setTimeLeft(diff);
    }, 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);
  return { days, hours, minutes, seconds, total: timeLeft };
}

/* ---------------------------- Typing effect ---------------------------- */
function useTyping(lines: string[], speed = 50, pauseBetween = 900) {
  const [index, setIndex] = useState(0);
  const [output, setOutput] = useState("");
  useEffect(() => {
    let mounted = true;
    let charIdx = 0;
    function typeLine() {
      if (!mounted) return;
      if (charIdx <= lines[index].length) {
        setOutput(lines[index].slice(0, charIdx));
        charIdx++;
        setTimeout(typeLine, speed);
      } else {
        setTimeout(() => {
          if (!mounted) return;
          setOutput(lines[index]);
          setTimeout(() => {
            // move to next
            setIndex((s) => (s + 1) % lines.length);
            charIdx = 0;
          }, pauseBetween);
        }, 0);
      }
    }
    typeLine();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  return output;
}

/* ---------------------------- Simple Slider (gallery) ---------------------------- */
function GallerySlider({ images }: { images: string[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      const s = el.scrollLeft;
      const newIndex = Math.round(s / w);
      setIdx(newIndex);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: i * w, behavior: "smooth" });
  };

  return (
    <div className="w-full">
      <div
        ref={ref}
        className="w-full overflow-x-auto snap-x snap-mandatory flex gap-4 touch-pan-x"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            className="snap-center flex-shrink-0 w-full md:w-2/3 lg:w-1/2 relative"
            style={{ minWidth: "100%" }}
          >
            <motion.div
              whileInView={{ scale: 1.03 }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl overflow-hidden shadow-lg border"
            >
              <Image
                src={img}
                alt={`gallery-${i}`}
                width={1200}
                height={800}
                className="object-cover w-full h-[60vh]"
                priority={i === 0}
              />
            </motion.div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          aria-label="prev"
          onClick={() => go(Math.max(0, idx - 1))}
          className="p-2 rounded-full bg-white/80 shadow"
        >
          ◀
        </button>
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`w-3 h-3 rounded-full ${i === idx ? "bg-pink-600" : "bg-gray-300"}`}
            aria-label={`go-${i}`}
          />
        ))}
        <button
          aria-label="next"
          onClick={() => go(Math.min(images.length - 1, idx + 1))}
          className="p-2 rounded-full bg-white/80 shadow"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- Heart animation on RSVP success ---------------------------- */
function HeartBurst({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="relative w-40 h-40">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 0, x: 0, opacity: 1, scale: 0.6 }}
                animate={{
                  y: -150 - Math.random() * 60,
                  x: (Math.random() - 0.5) * 200,
                  opacity: 0,
                  scale: 1.2,
                }}
                transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.05 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-pink-500 drop-shadow-lg">
                  <path d="M12 21s-7-4.35-9.5-7.5C-0.5 8.5 6 3 12 8c6-5 12.5.5 9.5 5.5C19 16.65 12 21 12 21z" />
                </svg>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------- Main page ---------------------------- */
export default function Home() {
  // open letter modal toggles site visibility
  const [openLetter, setOpenLetter] = useState(false);
  // RSVP
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  // music control
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown target: updated date
  const targetDate = new Date("2025-10-16T10:00:00"); // 16 Oct 2025 10:00
  const { days, hours, minutes, seconds } = useCountdown(targetDate);

  // typing lines for details
  const typingText = useTyping(
    [
      "Thời gian: 10:00 - 16/10/2025 (Mùng 7 tháng 9 âm lịch)",
      "Địa điểm: Trung tâm Hội nghị White Palace Nghệ An",
      "Địa chỉ: 123 Đường Lê Lợi, TP. Vinh, Nghệ An",
    ],
    35,
    1200
  );

  // parallax transform for details image
  const detailsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onScroll = () => {
      const el = detailsRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mid = window.innerHeight / 2;
      const offset = (rect.top - mid) * 0.05; // small tilt
      el.style.transform = `rotate(${offset}deg) translateY(${Math.max(-30, Math.min(30, -offset * 2))}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // play music when letter opened
  useEffect(() => {
    if (openLetter && audioRef.current) {
      // try to play; may require user gesture — opening letter counts as click
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        /* ignore autoplay block */
      });
    }
  }, [openLetter]);

  // RSVP submit handler
  const handleRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpSuccess(true);
    setTimeout(() => {
      setRsvpSuccess(false);
      setRsvpOpen(false);
    }, 1400);
  };

  return (
    <main className={`${lora.className} bg-[#fff8f7] text-gray-800`}>
      {/* background music (wedding music) */}
      <audio ref={audioRef} src="/music/wedding-music.mp3" loop />
      <FloatingDecor />

      {/* Opening letter modal */}
      {!openLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm text-center cursor-pointer"
            onClick={() => setOpenLetter(true)}
          >
            <Image src="/images/letter.jpg" alt="letter" width={320} height={220} className="rounded-lg" />
            <h3 className={`${playfair.className} text-2xl mt-4`}>Bạn được mời</h3>
            <p className="mt-2 text-sm text-gray-600">Click để mở thiệp mời</p>
          </motion.div>
        </div>
      )}

      {/* SITE CONTENT */}
      {openLetter && (
        <>
          {/* HERO (100vh) */}
          <section className="relative w-full h-screen overflow-hidden">
            <motion.div
              initial={{ scale: 1.06, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.8 }}
              className="absolute inset-0"
            >
              <Image
                src="/images/anh1.jpeg"
                alt="couple"
                fill
                className="object-cover"
                priority
              />
            </motion.div>

            {/* gradient overlay top->transparent */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/40 to-transparent" />

            <div className="relative z-20 h-full flex items-center justify-center px-6">
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                className="text-center max-w-3xl"
              >
                <p className="text-sm md:text-base text-gray-600 mb-4">Trân trọng kính mời</p>
                <h1 className={`${playfair.className} text-3xl md:text-6xl leading-tight text-pink-700`}>
                  Kính mời bạn đến dự lễ cưới của chúng tôi
                </h1>
                <h2 className={`${playfair.className} text-2xl md:text-4xl mt-6 text-gray-800`}>
                  <span className="block">Trình Trần Phương Tuấn</span>
                  <span className="block text-xl md:text-2xl mt-2">và</span>
                  <span className="block mt-2">Nguyễn Thiên Ân</span>
                </h2>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-8 flex items-center justify-center gap-4"
                >
                  <button
                    onClick={() => {
                      document.getElementById("details")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-6 py-3 rounded-full bg-pink-600 text-white shadow hover:scale-105 transition"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    onClick={() => setRsvpOpen(true)}
                    className="px-4 py-2 rounded-full border border-pink-600 text-pink-600 hover:bg-pink-50 transition"
                  >
                    Xác nhận tham dự
                  </button>
                </motion.div>
              </motion.div>
            </div>

            {/* top floating tiny petals/bubbles */}
            <div className="absolute top-6 left-6 z-30">
              <div className="w-12 h-12 rounded-full bg-white/60 blur-sm" />
            </div>
          </section>

          {/* DETAILS with parallax & countdown */}
          <section id="details" className="py-12 md:py-24 px-6 md:px-20 bg-white">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
              <motion.div
                ref={detailsRef}
                style={{ transformOrigin: "center" }}
                className="order-2 md:order-1"
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.9 }}
              >
                <div className="rounded-3xl overflow-hidden shadow-lg">
                  <Image src="/images/anh2.jpeg" alt="hands" width={1200} height={900} className="object-cover w-full h-[56vh]" />
                </div>
              </motion.div>

              <div className="order-1 md:order-2 text-center md:text-left">
                <h3 className={`${playfair.className} text-3xl md:text-4xl text-pink-700`}>It's All in the Details</h3>

                <div className="mt-6 text-lg text-gray-700">
                  {/* typing effect lines */}
                  <p className="mb-3 font-medium">{typingText}</p>

                  <div className="mt-6 inline-block bg-pink-50 px-4 py-3 rounded-lg shadow">
                    <p className="text-sm text-gray-600">Countdown đến ngày cưới</p>
                    <div className="mt-2 flex gap-3 justify-center md:justify-start">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-pink-600">{days}</div>
                        <div className="text-xs text-gray-500">Ngày</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-pink-600">{hours}</div>
                        <div className="text-xs text-gray-500">Giờ</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-pink-600">{minutes}</div>
                        <div className="text-xs text-gray-500">Phút</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-pink-600">{seconds}</div>
                        <div className="text-xs text-gray-500">Giây</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 justify-center md:justify-start">
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Trung tâm Hội nghị White Palace Nghệ An, 123 Đường Lê Lợi, TP. Vinh, Nghệ An")}`}
                      className="px-4 py-2 bg-white border rounded-lg shadow-sm text-pink-600 hover:bg-pink-50 transition"
                    >
                      Xem bản đồ
                    </a>
                    <button
                      onClick={() => setRsvpOpen(true)}
                      className="px-4 py-2 bg-pink-600 text-white rounded-lg shadow hover:scale-105 transition"
                    >
                      Xác nhận tham dự
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* NOTES section */}
          <section className="py-12 md:py-20 px-6 md:px-20 bg-[#fff3f6]">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="flex-1"
              >
                <div className="rounded-3xl overflow-hidden shadow-lg">
                  <Image src="/images/anh3.jpeg" alt="ban tiec" width={1200} height={900} className="object-cover w-full h-[56vh]" />
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="flex-1 text-center md:text-left"
              >
                <h3 className={`${playfair.className} text-2xl text-pink-700`}>Lưu ý nhẹ nhàng</h3>
                <ul className="mt-6 space-y-3 text-gray-700">
                  <li className="flex items-center gap-3">
                    <span className="inline-block animate-bounce">🎉</span>
                    Vui lòng đến đúng giờ để chung vui
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="inline-block">👗</span>
                    Trang phục: Lịch sự - Thanh nhã
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="inline-block">🎁</span>
                    Nếu cần gửi quà mừng, xin liên hệ trước để chúng tôi sắp xếp
                  </li>
                </ul>
              </motion.div>
            </div>
          </section>

          {/* GALLERY (slider) */}
          <section className="py-12 md:py-20 px-6 md:px-20 bg-white">
            <div className="max-w-6xl mx-auto text-center">
              <h3 className={`${playfair.className} text-2xl text-pink-700`}>Album ảnh</h3>
              <p className="mt-3 text-gray-600">Vuốt để xem - cảm nhận khoảnh khắc</p>

              <div className="mt-8">
                <GallerySlider images={["/images/anh1.jpeg", "/images/anh2.jpeg", "/images/anh3.jpeg", "/images/anh4.jpeg", "/images/anh5.jpeg", "/images/anh6.jpeg"]} />
              </div>
            </div>
          </section>

          {/* RSVP modal */}
          <AnimatePresence>
            {rsvpOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
                >
                  <h4 className={`${playfair.className} text-xl text-pink-700`}>Xác nhận tham dự</h4>
                  <form className="mt-4 space-y-3" onSubmit={handleRsvp}>
                    <input required name="name" placeholder="Tên khách mời" className="w-full border px-3 py-2 rounded-lg" />
                    <input required name="count" type="number" min={1} placeholder="Số lượng" className="w-full border px-3 py-2 rounded-lg" />
                    <div className="flex gap-3 justify-end">
                      <button type="button" onClick={() => setRsvpOpen(false)} className="px-4 py-2 rounded-lg border">
                        Hủy
                      </button>
                      <motion.button whileHover={{ scale: 1.03 }} className="px-4 py-2 bg-pink-600 text-white rounded-lg">
                        Xác nhận
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Heart burst on RSVP success */}
          <HeartBurst show={rsvpSuccess} />

          {/* Final section */}
          <section className="relative py-20 px-6 md:px-20 bg-[#fff0f6]">
            <div className="max-w-6xl mx-auto text-center">
              <div className="mx-auto w-full md:w-3/4 lg:w-2/3 rounded-3xl overflow-hidden shadow-lg">
                <Image src="/images/anh6.jpeg" alt="final" width={1600} height={900} className="object-cover w-full h-[50vh]" />
              </div>
              <h3 className={`${playfair.className} text-3xl mt-8`}>Hẹn gặp lại bạn trong ngày trọng đại của chúng tôi 💖</h3>
              <p className="mt-4 text-gray-600">Cảm ơn bạn đã là một phần của khoảnh khắc này.</p>
              <div className="mt-8">
                <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="px-6 py-3 rounded-full bg-pink-600 text-white">
                  Quay về đầu trang
                </button>
              </div>
            </div>

            {/* subtle fireworks (CSS particles) */}
            <div aria-hidden className="pointer-events-none fixed bottom-8 right-8 hidden md:block">
              <div className="firework w-36 h-36" />
            </div>
          </section>
        </>
      )}

      {/* CSS (Tailwind + small global styles) */}
      <style jsx global>{`
        /* floating items (snow) */
        .floating-item {
          position: absolute;
          top: -10%;
          width: 28px;
          height: 28px;
          background-image: url('/images/snow.webp');
          background-size: cover;
          background-position: center;
          border-radius: 8px;
          filter: blur(0.6px) saturate(0.9);
          animation-name: floatDown;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes floatDown {
          0% {
            transform: translateY(-10vh) rotate(0deg) scale(0.6);
            opacity: 0.95;
          }
          30% {
            transform: translateY(30vh) rotate(90deg) scale(0.8);
            opacity: 0.9;
          }
          60% {
            transform: translateY(70vh) rotate(180deg) scale(0.9);
            opacity: 0.7;
          }
          100% {
            transform: translateY(120vh) rotate(360deg) scale(1.1);
            opacity: 0;
          }
        }

        /* small firework placeholder (subtle) */
        .firework {
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), rgba(255,192,203,0.08) 20%, transparent 40%), radial-gradient(circle at 70% 70%, rgba(255,240,245,0.9), rgba(255,192,203,0.06) 15%, transparent 35%);
          border-radius: 999px;
          box-shadow: 0 8px 30px rgba(236,72,153,0.15), inset 0 -6px 20px rgba(236,72,153,0.06);
          animation: fire 3s ease-in-out infinite;
        }
        @keyframes fire {
          0% { transform: scale(0.95) rotate(0deg); opacity: 0.9; }
          50% { transform: scale(1.06) rotate(8deg); opacity: 1; }
          100% { transform: scale(0.95) rotate(0deg); opacity: 0.9; }
        }

        /* make slider snap smooth on iOS */
        .touch-pan-x {
          -webkit-overflow-scrolling: touch;
        }

        /* improve image rendering */
        img {
          -webkit-user-drag: none;
        }

        /* small responsive tweaks */
        @media (min-width: 768px) {
          .floating-item { width: 32px; height: 32px; }
        }

      `}</style>
    </main>
  );
}

