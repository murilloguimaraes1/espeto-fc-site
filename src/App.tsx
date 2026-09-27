/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Phone, 
  Instagram, 
  Menu, 
  X, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Flame, 
  Maximize2
} from 'lucide-react';

// Import assets
import cervejasFreezerImg from './assets/images/cervejas_freezer_1790452922557.jpg';
import ambienteFreezerImg from './assets/images/ambiente_freezer_novo.png';
import ambienteLocalImg from './assets/images/ambiente_local_novo.png';
import ambienteTelaoImg from './assets/images/ambiente_telao_novo.png';
import espetosImg from './assets/images/espeto_fc_espetos_1790451396031.jpg';
import logoImg from './assets/images/logo_gu_premium_1790452370698.jpg';
import logoEspetoFcOficial from './assets/images/logo_espeto_fc_oficial.jpg';
import paoAlhoImg from './assets/images/espetinho_pao_alho_1790451800193.jpg';
import queijoCoalhoImg from './assets/images/espetinho_queijo_coalho_1790451812748.jpg';
import playgroundKidsImg from './assets/images/playground_kids_nova.jpg';
import espetoPicanhaImg from './assets/images/espeto_picanha.jpg';
import fileMignonLegumesImg from './assets/images/file_mignon_legumes.jpg';
import medalhaoCupimQueijoImg from './assets/images/medalhao_cupim_queijo.jpg';

// Core Parameters
const WHATSAPP_NUMBER = "5517991056116";
const INSTAGRAM_URL = "https://www.instagram.com/espeto.fc/";
const CARDAPIO_URL = "https://drive.google.com/drive/folders/1kYDVXrNFm3-TOz_M9Mk9lHc6Hhk5nldm";

// Frame counts
const TOTAL_LOJA_FRAMES = 183;
const TOTAL_ESPETO_FRAMES = 80;

// Ajustado para 450px para transição gradual e perceptível
const DISTANCIA_CURTA_ESPETO = 450;

// Helpers de URL para os frames otimizados em WebP
const getLojaFrameUrl = (index: number) => {
  const pad = String(index).padStart(3, '0');
  return `/frames_loja/frame_${pad}.webp`;
};

const getEspetoFrameUrl = (index: number) => {
  const pad = String(index).padStart(3, '0');
  return `/frames_espeto/frame_${pad}.webp`;
};

interface VisualHighlight {
  id: string;
  name: string;
  tag: string;
  description: string;
  image: string;
}

const VISUAL_HIGHLIGHTS: VisualHighlight[] = [
  {
    id: "espeto-picanha",
    name: "ESPETO DE PICANHA",
    tag: "CARNE NOBRE",
    description: "Picanha selecionada, suculenta e grelhada no ponto certo.",
    image: espetoPicanhaImg
  },
  {
    id: "file-mignon-legumes",
    name: "FILÉ MIGNON COM LEGUMES",
    tag: "LEVE & SABOROSO",
    description: "Filé mignon macio intercalado com legumes frescos na brasa.",
    image: fileMignonLegumesImg
  },
  {
    id: "medalhao-cupim-queijo",
    name: "MEDALHÃO DE CUPIM COM QUEIJO COALHO",
    tag: "FAVORITO DA CASA",
    description: "Cupim desfiado em medalhão, finalizado com queijo coalho grelhado.",
    image: medalhaoCupimQueijoImg
  }
];

interface AmbienteSlide {
  id: string;
  tag: string;
  title: string;
  image: string;
  alt: string;
}

const AMBIENTE_SLIDES: AmbienteSlide[] = [
  {
    id: "freezer",
    tag: "01. CERVEJA TRINCANDO",
    title: "FREEZERS NEGATIVOS",
    image: ambienteFreezerImg,
    alt: "Freezers de cerveja trincando"
  },
  {
    id: "local",
    tag: "02. AMBIENTE CLIMATIZADO",
    title: "CONFORTO DA GALERA",
    image: ambienteLocalImg,
    alt: "Ambiente do Espeto F.C."
  },
  {
    id: "telao",
    tag: "03. TELÃO GIGANTE",
    title: "NENHUM LANCE PASSA DESPERCEBIDO",
    image: ambienteTelaoImg,
    alt: "Telão de alta definição"
  }
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number>(0);
  const [activeAmbienteIndex, setActiveAmbienteIndex] = useState<number>(0);

  // Controle de pausa e toque manual do carrossel do Ambiente
  const isAmbientePausedRef = useRef<boolean>(false);
  const ambientePauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Visibilidade do espeto no Hero
  const [espetoVisible, setEspetoVisible] = useState<boolean>(true);

  // Opacidade da animação automática de fogo/chama no Hero (fade out suave no scroll)
  const [heroFireOpacity, setHeroFireOpacity] = useState<number>(1);

  // Elementos e containers
  const lojaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const espetoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);

  // Arrays de imagens pré-carregadas
  const lojaImagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_LOJA_FRAMES).fill(null));
  const espetoImagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_ESPETO_FRAMES).fill(null));

  // Progresso atual para re-render no resize
  const currentLojaProgressRef = useRef<number>(0);
  const currentEspetoProgressRef = useRef<number>(0);

  // Referências para navegação
  const sectionRefs = {
    home: useRef<HTMLElement>(null),
    sobre: useRef<HTMLElement>(null),
    destaques: useRef<HTMLElement>(null),
    ambiente: useRef<HTMLElement>(null),
    playground: useRef<HTMLElement>(null),
    contato: useRef<HTMLElement>(null)
  };

  const scrollToSection = (section: keyof typeof sectionRefs) => {
    setShowMobileMenu(false);
    sectionRefs[section].current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Desenhar vídeo da loja centralizado em cover com suporte a crossfade suave entre frames
  const drawLojaCover = useCallback((
    canvas: HTMLCanvasElement, 
    imgA: HTMLImageElement,
    imgB: HTMLImageElement | null = null,
    blend: number = 0
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const targetWidth = Math.round(w * dpr);
    const targetHeight = Math.round(h * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const imgW = imgA.naturalWidth || 1080;
    const imgH = imgA.naturalHeight || 1920;
    const imgRatio = imgW / imgH;
    const canvasRatio = w / h;

    let renderW = w;
    let renderH = h;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      renderW = w;
      renderH = w / imgRatio;
      offsetY = (h - renderH) / 2;
      offsetX = 0;
    } else {
      renderH = h;
      renderW = h * imgRatio;
      offsetX = (w - renderW) / 2;
      offsetY = 0;
    }

    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1.0;
    ctx.drawImage(imgA, offsetX, offsetY, renderW, renderH);

    // Interpolação suave (crossfade) com o próximo frame
    if (imgB && blend > 0.02 && blend < 0.98) {
      ctx.globalAlpha = blend;
      ctx.drawImage(imgB, offsetX, offsetY, renderW, renderH);
    }

    ctx.restore();
  }, []);

  // 2. Desenhar o espeto no lado DIREITO com suporte a crossfade suave entre frames
  const drawEspetoRight = useCallback((
    canvas: HTMLCanvasElement, 
    imgA: HTMLImageElement,
    imgB: HTMLImageElement | null = null,
    blend: number = 0
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth || window.innerWidth;
    const h = rect.height || canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const targetWidth = Math.round(w * dpr);
    const targetHeight = Math.round(h * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const imgW = imgA.naturalWidth || 1080;
    const imgH = imgA.naturalHeight || 1920;
    const imgRatio = imgW / imgH;

    const renderH = h;
    const renderW = Math.max(w * 0.68, h * imgRatio);
    const offsetX = w - renderW; // Encostado na borda direita
    const offsetY = 0;

    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1.0;
    ctx.drawImage(imgA, offsetX, offsetY, renderW, renderH);

    // Interpolação suave (crossfade) com o próximo frame
    if (imgB && blend > 0.02 && blend < 0.98) {
      ctx.globalAlpha = blend;
      ctx.drawImage(imgB, offsetX, offsetY, renderW, renderH);
    }

    ctx.restore();
  }, []);

  // Renderizar frame da loja com interpolação contínua (crossfade entre frames consecutivos)
  const renderLojaFrame = useCallback((progress: number) => {
    const canvas = lojaCanvasRef.current;
    if (!canvas) return;

    const exactIndex = Math.min(
      TOTAL_LOJA_FRAMES - 1, 
      Math.max(0, progress * (TOTAL_LOJA_FRAMES - 1))
    );
    const indexA = Math.floor(exactIndex);
    const indexB = Math.min(TOTAL_LOJA_FRAMES - 1, indexA + 1);
    const blend = exactIndex - indexA;

    let imgA = lojaImagesRef.current[indexA];
    let imgB = lojaImagesRef.current[indexB];

    if (!imgA) {
      for (let i = indexA - 1; i >= 0; i--) {
        if (lojaImagesRef.current[i]) { imgA = lojaImagesRef.current[i]; break; }
      }
      if (!imgA) {
        for (let i = indexA + 1; i < TOTAL_LOJA_FRAMES; i++) {
          if (lojaImagesRef.current[i]) { imgA = lojaImagesRef.current[i]; break; }
        }
      }
    }

    if (imgA) {
      drawLojaCover(canvas, imgA, imgB, blend);
    }
  }, [drawLojaCover]);

  // Renderizar frame do espeto com interpolação contínua (crossfade entre frames consecutivos)
  const renderEspetoFrame = useCallback((progress: number) => {
    const canvas = espetoCanvasRef.current;
    if (!canvas) return;

    const exactIndex = Math.min(
      TOTAL_ESPETO_FRAMES - 1, 
      Math.max(0, progress * (TOTAL_ESPETO_FRAMES - 1))
    );
    const indexA = Math.floor(exactIndex);
    const indexB = Math.min(TOTAL_ESPETO_FRAMES - 1, indexA + 1);
    const blend = exactIndex - indexA;

    let imgA = espetoImagesRef.current[indexA];
    let imgB = espetoImagesRef.current[indexB];

    if (!imgA) {
      for (let i = indexA - 1; i >= 0; i--) {
        if (espetoImagesRef.current[i]) { imgA = espetoImagesRef.current[i]; break; }
      }
      if (!imgA) {
        for (let i = indexA + 1; i < TOTAL_ESPETO_FRAMES; i++) {
          if (espetoImagesRef.current[i]) { imgA = espetoImagesRef.current[i]; break; }
        }
      }
    }

    if (imgA) {
      drawEspetoRight(canvas, imgA, imgB, blend);
    }
  }, [drawEspetoRight]);

  // Atualização sincronizada de scroll
  const updateScrollProgress = useCallback(() => {
    const scrollAtual = window.scrollY || window.pageYOffset || 0;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight || 1;
    const heroHeight = heroSectionRef.current?.offsetHeight || winHeight;

    // 1. VÍDEO DE FUNDO (frames_loja):
    // Anima a jornada da loja suavemente ao longo de toda a extensão
    const maxScrollLoja = Math.max(1, docHeight - heroHeight - winHeight);
    const progressLoja = Math.min(Math.max((scrollAtual - heroHeight) / maxScrollLoja, 0), 1);
    currentLojaProgressRef.current = progressLoja;
    renderLojaFrame(progressLoja);

    // 2. EFEITO DO ESPETO (frames_espeto):
    // Roda nos primeiros 450px de scroll
    const progressEspeto = Math.min(Math.max(scrollAtual / DISTANCIA_CURTA_ESPETO, 0), 1);
    currentEspetoProgressRef.current = progressEspeto;

    const isEspetoAtivo = scrollAtual < DISTANCIA_CURTA_ESPETO + 80;
    setEspetoVisible(isEspetoAtivo);

    if (scrollAtual < heroHeight + 50) {
      renderEspetoFrame(progressEspeto);
    }

    // 3. Fogo do Hero (vídeo fogo-hero.mp4): visível antes do scroll, com fade out suave no início da rolagem (0 a 130px)
    // Ao rolar de volta para o topo (Hero visível novamente), o fogo reaparece e volta a tocar em loop
    const fireOpacity = Math.max(0, 1 - scrollAtual / 130);
    setHeroFireOpacity(fireOpacity);

    if (heroVideoRef.current) {
      if (scrollAtual < 150 && heroVideoRef.current.paused) {
        heroVideoRef.current.play().catch(() => {});
      }
    }
  }, [renderLojaFrame, renderEspetoFrame]);

  // Pré-carregamento por lotes
  useEffect(() => {
    let isMounted = true;

    const preloadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Erro ao carregar: ${url}`));
      });
    };

    const loadSequences = async () => {
      // Prioridade 1: Frame 0 de ambos imediatamente
      try {
        const [imgLoja0, imgEspeto0] = await Promise.all([
          preloadImage(getLojaFrameUrl(0)),
          preloadImage(getEspetoFrameUrl(0))
        ]);
        if (!isMounted) return;
        lojaImagesRef.current[0] = imgLoja0;
        espetoImagesRef.current[0] = imgEspeto0;
        renderLojaFrame(0);
        renderEspetoFrame(0);
      } catch (err) {
        console.warn("Aviso inicial de frames:", err);
      }

      // Prioridade 2: Primeiros 25 frames do espeto e 20 da loja
      const espetoBatch1 = Array.from({ length: 25 }, (_, i) => i + 1);
      const lojaBatch1 = Array.from({ length: 20 }, (_, i) => i + 1);

      await Promise.all([
        ...espetoBatch1.map(async i => {
          try {
            const img = await preloadImage(getEspetoFrameUrl(i));
            if (isMounted) espetoImagesRef.current[i] = img;
          } catch {}
        }),
        ...lojaBatch1.map(async i => {
          try {
            const img = await preloadImage(getLojaFrameUrl(i));
            if (isMounted) lojaImagesRef.current[i] = img;
          } catch {}
        })
      ]);

      if (isMounted) {
        renderEspetoFrame(currentEspetoProgressRef.current);
        renderLojaFrame(currentLojaProgressRef.current);
      }

      // Prioridade 3: Restante do espeto (26 a 79)
      const espetoBatch2 = Array.from({ length: TOTAL_ESPETO_FRAMES - 26 }, (_, i) => i + 26);
      await Promise.all(
        espetoBatch2.map(async i => {
          try {
            const img = await preloadImage(getEspetoFrameUrl(i));
            if (isMounted) espetoImagesRef.current[i] = img;
          } catch {}
        })
      );

      // Prioridade 4: Restante da jornada da loja em blocos de 25
      for (let start = 21; start < TOTAL_LOJA_FRAMES; start += 25) {
        if (!isMounted) break;
        const end = Math.min(start + 25, TOTAL_LOJA_FRAMES);
        const chunk = Array.from({ length: end - start }, (_, i) => start + i);
        await Promise.all(
          chunk.map(async i => {
            try {
              const img = await preloadImage(getLojaFrameUrl(i));
              if (isMounted) lojaImagesRef.current[i] = img;
            } catch {}
          })
        );
        if (isMounted) renderLojaFrame(currentLojaProgressRef.current);
        await new Promise(r => setTimeout(r, 40));
      }
    };

    loadSequences();

    return () => {
      isMounted = false;
    };
  }, [renderLojaFrame, renderEspetoFrame]);

  // Listener de scroll e resize otimizado com requestAnimationFrame
  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateScrollProgress();
        rafId = null;
      });
    };

    const handleResize = () => {
      renderLojaFrame(currentLojaProgressRef.current);
      renderEspetoFrame(currentEspetoProgressRef.current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [updateScrollProgress, renderLojaFrame, renderEspetoFrame]);

  // Intervalo do carrossel de destaques
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHighlightIndex((prev) => (prev + 1) % VISUAL_HIGHLIGHTS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Intervalo do carrossel do Ambiente com troca suave a cada 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isAmbientePausedRef.current) {
        setActiveAmbienteIndex((prev) => (prev + 1) % AMBIENTE_SLIDES.length);
      }
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleManualAmbienteChange = useCallback((index: number) => {
    setActiveAmbienteIndex(index);
    isAmbientePausedRef.current = true;
    if (ambientePauseTimeoutRef.current) clearTimeout(ambientePauseTimeoutRef.current);
    ambientePauseTimeoutRef.current = setTimeout(() => {
      isAmbientePausedRef.current = false;
    }, 6000);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    touchStartXRef.current = null;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleManualAmbienteChange((activeAmbienteIndex + 1) % AMBIENTE_SLIDES.length);
      } else {
        handleManualAmbienteChange((activeAmbienteIndex - 1 + AMBIENTE_SLIDES.length) % AMBIENTE_SLIDES.length);
      }
    }
  };


  const handleWhatsAppRedirect = (text: string) => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative min-h-viewport bg-transparent text-[#F5F5F5] selection:bg-[#B31217] selection:text-white flex flex-col antialiased overflow-x-hidden font-sans">
      
      {/* 1. VÍDEO DE FUNDO (frames_loja) — Fixo, sempre renderizado em z-index 1 atrás das seções */}
      <canvas 
        ref={lojaCanvasRef}
        aria-hidden="true"
        className="fixed-store-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />


      {/* HEADER / TOP BAR */}
      <header className="sticky top-0 z-50 h-14 sm:h-16 bg-[#0f1c12]/92 backdrop-blur-md border-b border-[#D4AF37]/15 flex items-center justify-between px-3 sm:px-6 md:px-8 w-full">
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={() => scrollToSection('home')}
            className="text-base sm:text-xl md:text-2xl font-black tracking-wider text-[#F5F5F5] font-display flex items-center gap-1 focus:outline-none"
          >
            <span className="text-[#D4AF37]">ESPETO</span>
            <span className="text-[#D4AF37] border-l-2 border-[#D4AF37]/30 pl-1.5">F.C.</span>
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium tracking-wide">
          <button onClick={() => scrollToSection('home')} className="hover:text-[#D4AF37] transition-colors uppercase font-display py-1">Início</button>
          <button onClick={() => scrollToSection('sobre')} className="hover:text-[#D4AF37] transition-colors uppercase font-display py-1">Sobre</button>
          <button onClick={() => scrollToSection('destaques')} className="hover:text-[#D4AF37] transition-colors uppercase font-display py-1">Cardápio</button>
          <button onClick={() => scrollToSection('ambiente')} className="hover:text-[#D4AF37] transition-colors uppercase font-display py-1">Ambiente</button>
          <button onClick={() => scrollToSection('playground')} className="hover:text-[#D4AF37] transition-colors uppercase font-display py-1">Kids</button>
          <button onClick={() => scrollToSection('contato')} className="hover:text-[#D4AF37] transition-colors uppercase font-display py-1">Contato</button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a 
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hidden xs:flex w-8 h-8 sm:w-9 sm:h-9 items-center justify-center rounded-lg bg-[#1F3D24]/80 text-[#F5F5F5] hover:text-[#D4AF37] border border-[#D4AF37]/20 transition-all"
          >
            <Instagram size={16} />
          </a>
          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Vi o Espeto F.C. no site e quero reservar uma mesa.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 sm:h-9 px-3 sm:px-4 rounded-lg bg-[#B31217] text-white hover:bg-[#920e12] font-semibold text-[10px] sm:text-xs tracking-wider flex items-center gap-1.5 border border-[#D4AF37]/20 transition-all active:scale-95 shadow-md"
          >
            <Phone size={12} />
            <span className="font-display">RESERVAR</span>
          </a>

          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Menu"
            className="md:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-[#1F3D24] border border-[#D4AF37]/20 text-[#F5F5F5]"
          >
            {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU SHEET */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="md:hidden fixed top-14 sm:top-16 left-0 right-0 z-40 bg-[#0f1c12]/98 border-b border-[#D4AF37]/20 p-5 flex flex-col gap-2.5 shadow-2xl backdrop-blur-md"
          >
            <button 
              onClick={() => scrollToSection('home')}
              className="text-left py-2.5 px-3.5 rounded-lg bg-[#1F3D24]/40 text-[#F5F5F5] hover:bg-[#1F3D24] transition-all font-display text-sm flex items-center justify-between"
            >
              <span>INÍCIO</span>
              <ChevronRight size={14} className="text-[#D4AF37]" />
            </button>
            <button 
              onClick={() => scrollToSection('sobre')}
              className="text-left py-2.5 px-3.5 rounded-lg bg-[#1F3D24]/40 text-[#F5F5F5] hover:bg-[#1F3D24] transition-all font-display text-sm flex items-center justify-between"
            >
              <span>SOBRE O POINT</span>
              <ChevronRight size={14} className="text-[#D4AF37]" />
            </button>
            <button 
              onClick={() => scrollToSection('destaques')}
              className="text-left py-2.5 px-3.5 rounded-lg bg-[#1F3D24]/40 text-[#F5F5F5] hover:bg-[#1F3D24] transition-all font-display text-sm flex items-center justify-between"
            >
              <span>CARDÁPIO DESTAQUE</span>
              <ChevronRight size={14} className="text-[#D4AF37]" />
            </button>
            <button 
              onClick={() => scrollToSection('ambiente')}
              className="text-left py-2.5 px-3.5 rounded-lg bg-[#1F3D24]/40 text-[#F5F5F5] hover:bg-[#1F3D24] transition-all font-display text-sm flex items-center justify-between"
            >
              <span>AMBIENTE</span>
              <ChevronRight size={14} className="text-[#D4AF37]" />
            </button>
            <button 
              onClick={() => scrollToSection('playground')}
              className="text-left py-2.5 px-3.5 rounded-lg bg-[#1F3D24]/40 text-[#F5F5F5] hover:bg-[#1F3D24] transition-all font-display text-sm flex items-center justify-between"
            >
              <span>ESPAÇO KIDS</span>
              <ChevronRight size={14} className="text-[#D4AF37]" />
            </button>
            <button 
              onClick={() => scrollToSection('contato')}
              className="text-left py-2.5 px-3.5 rounded-lg bg-[#1F3D24]/40 text-[#F5F5F5] hover:bg-[#1F3D24] transition-all font-display text-sm flex items-center justify-between"
            >
              <span>ONDE ESTAMOS</span>
              <ChevronRight size={14} className="text-[#D4AF37]" />
            </button>

            <div className="pt-3 border-t border-[#D4AF37]/10 flex justify-between items-center text-xs">
              <span className="text-[#AAAAAA]">Instagram:</span>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] font-semibold flex items-center gap-1 font-display">
                <Instagram size={13} /> @espeto.fc
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. HERO SECTION — ESPETO À DIREITA, TEXTO À ESQUERDA, NENHUMA SOBREPOSIÇÃO */}
      <section 
        ref={(el) => {
          sectionRefs.home.current = el;
          heroSectionRef.current = el;
        }}
        className="relative min-h-viewport flex flex-col justify-center bg-black text-[#F5F5F5] px-4 sm:px-8 py-10 sm:py-16 overflow-hidden z-20"
      >
        {/* Canvas do espeto — restrito exclusivamente ao container do Hero */}
        <canvas 
          ref={espetoCanvasRef}
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full pointer-events-none z-10 transition-opacity duration-500 ease-out ${
            espetoVisible ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* VÍDEO DE FOGO EM LOOP NO HERO (fogo-hero.mp4) — Preenche toda a área do Hero como camada de fundo */}
        <div 
          className="absolute inset-0 w-full h-full pointer-events-none z-12 overflow-hidden transition-opacity duration-300"
          style={{ opacity: heroFireOpacity }}
          aria-hidden="true"
        >
          <video
            ref={heroVideoRef}
            src="/fogo-hero.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover mix-blend-screen opacity-90"
          />
        </div>

        {/* Gradiente escuro no lado esquerdo para garantir legibilidade perfeita da tipografia */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent pointer-events-none z-15" />

        {/* Bloco de conteúdo do Hero — Alinhado à esquerda */}
        <div className="relative z-20 w-full max-w-5xl mx-auto flex flex-col justify-center items-start text-left">
          
          <div className="w-[64%] sm:w-[56%] md:w-[50%] space-y-4 sm:space-y-5">
            
            {/* Logo Badge + Tagline */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1F3D24] border-2 border-[#D4AF37] flex items-center justify-center p-0.5 shadow-lg shrink-0 overflow-hidden">
                <img src={logoEspetoFcOficial} alt="Espeto F.C. Logo Oficial" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="inline-flex items-center gap-1.5 bg-[#1F3D24]/90 text-white py-1 px-3 rounded-full text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider border border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                <Flame size={11} className="text-[#D4AF37]" />
                <span className="tracking-widest">CHURRASCO & FUTEBOL</span>
              </div>
            </div>

            {/* Título de Impacto com peso aumentado e sombra reforçada */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.12] text-white font-display title-shadow-strong">
              AQUI O JOGO É MELHOR <br />
              <span className="metallic-gold-text">
                COM ESPETO E CERVEJA GELADA
              </span>
            </h1>

            {/* Subtítulo Curto com maior espaçamento */}
            <p className="text-[#E0E0E0] text-xs sm:text-sm leading-relaxed title-shadow font-medium max-w-md">
              Telão gigante, brasa acesa e o point certo pra cada rodada.
            </p>

            {/* Botões com hierarquia visual e animação suave */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-3 w-full">
              <a 
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Vi o Espeto F.C. no site e quero reservar uma mesa para curtir o jogo.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pulse-glow px-4 py-2.5 sm:py-3 rounded-xl bg-[#B31217] text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider hover:bg-[#920e12] border border-[#D4AF37]/50 transition-all text-center font-display flex items-center justify-center gap-1.5 shadow-xl active:scale-98"
              >
                <Phone size={13} />
                <span>RESERVAR MESA</span>
              </a>
              <a 
                href={CARDAPIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 sm:py-3 rounded-xl border border-white/50 bg-white/10 hover:bg-white/25 active:bg-white/35 text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all text-center font-display backdrop-blur-sm shadow-md active:scale-98 hover:border-white flex items-center justify-center"
              >
                CARDÁPIO
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* 3. SEÇÃO TRANSLÚCIDA LIVRE — VÍDEO DA LOJA COMO PROTAGONISTA EXCLUSIVO */}
      <section 
        ref={sectionRefs.sobre}
        aria-label="Experiência Espeto F.C."
        className="section-translucent min-h-[460px] sm:min-h-[520px] py-10 sm:py-14 px-4 sm:px-6 border-t border-[#D4AF37]/15 relative z-10 overflow-hidden"
      >
        {/* Seção com estrutura, altura e camada translúcida mantidas, sem texto ou imagem, destacando o vídeo da loja */}
      </section>

      {/* 4. SEÇÃO CARDÁPIO DESTAQUES — TESTE DE DIAGNÓSTICO */}
      <section 
        ref={sectionRefs.destaques}
        className="section-translucent-dark py-10 sm:py-14 px-4 sm:px-6 border-t border-[#D4AF37]/10 relative z-10"
      >
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="text-contrast-box max-w-md mx-auto">
              <span className="text-[10px] sm:text-xs text-[#D4AF37] font-bold uppercase tracking-widest block mb-1">CHURRASCO NA BRASA</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display title-shadow leading-tight">DESTAQUES DA CHAPA</h2>
              <div className="w-12 h-0.5 bg-[#B31217] mx-auto mt-2 mb-2" />
              <p className="text-xs text-[#E5E5E5] font-medium title-shadow">
                Cortes nobres assados na brasa com tempero artesanal.
              </p>
            </div>
          </div>

          {/* Carrossel de Fotos Flutuantes sem container/card ao redor */}
          <div className="relative my-7 sm:my-9 overflow-hidden w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeHighlightIndex}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-center"
              >
                {/* Foto Flutuante: ocupa 75-80% da tela mobile, com bordas arredondadas e sombra suave */}
                <div className="w-[78%] sm:w-[70%] md:w-[45%] max-w-[320px] md:max-w-[380px] shrink-0 mx-auto">
                  <div className="relative aspect-[16/10] overflow-hidden floating-photo">
                    <img 
                      src={VISUAL_HIGHLIGHTS[activeHighlightIndex].image} 
                      alt={VISUAL_HIGHLIGHTS[activeHighlightIndex].name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-[#B31217] text-white text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-[#D4AF37]/30 shadow-md">
                      {VISUAL_HIGHLIGHTS[activeHighlightIndex].tag}
                    </div>
                  </div>
                </div>

                {/* Texto do Destaque: fundo pontual mínimo apenas atrás das próprias palavras */}
                <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-2.5">
                  <div className="text-contrast-box max-w-sm">
                    <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest block mb-1">DESTAQUES DO ESPETO</span>
                    <h3 className="font-display font-extrabold text-xl text-white tracking-wide title-shadow leading-snug mb-1">
                      {VISUAL_HIGHLIGHTS[activeHighlightIndex].name}
                    </h3>
                    <p className="text-xs text-[#E5E5E5] leading-relaxed title-shadow">
                      {VISUAL_HIGHLIGHTS[activeHighlightIndex].description}
                    </p>
                  </div>
                  
                  {/* Indicadores do carrossel */}
                  <div className="pt-2 flex justify-center md:justify-start gap-1.5">
                    {VISUAL_HIGHLIGHTS.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveHighlightIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === activeHighlightIndex ? 'w-5 bg-[#D4AF37]' : 'w-1.5 bg-white/25'
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="text-center max-w-sm mx-auto">
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Gostaria de ver o cardápio completo de espetos e bebidas do Espeto F.C.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-[#B31217] text-white font-extrabold text-xs uppercase tracking-widest hover:bg-[#920e12] border border-[#D4AF37]/30 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-98 font-display"
            >
              <Phone size={14} />
              <span>CARDÁPIO COMPLETO NO WHATSAPP</span>
            </a>
          </div>

        </div>
      </section>

      {/* 5. SEÇÃO GALERIA DO AMBIENTE — TESTE DE DIAGNÓSTICO */}
      <section 
        ref={sectionRefs.ambiente}
        className="section-translucent py-10 sm:py-14 px-4 sm:px-6 border-t border-[#D4AF37]/15 relative z-10"
      >
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="text-contrast-box max-w-md mx-auto">
              <span className="text-[10px] sm:text-xs text-[#D4AF37] font-bold uppercase tracking-widest block mb-1">NOSSO ESPAÇO</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display title-shadow leading-tight">CLIMA DE ARQUIBANCADA</h2>
              <div className="w-12 h-0.5 bg-[#B31217] mx-auto mt-2 mb-2" />
              <p className="text-xs text-[#E5E5E5] font-medium title-shadow">
                Salão amplo e climatizado com visão total das telas.
              </p>
            </div>
          </div>

          {/* Card Único de Carrossel Centralizado no Ambiente com Troca Automática e Swipe */}
          <div className="my-7 sm:my-9 flex flex-col items-center justify-center w-full">
            <div 
              className="w-[78vw] sm:w-[70%] md:w-[45%] max-w-[320px] sm:max-w-[360px] mx-auto flex flex-col items-center select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Foto Flutuante Única com Fade Suave */}
              <div 
                onClick={() => setSelectedImage(AMBIENTE_SLIDES[activeAmbienteIndex].image)}
                className="w-full relative overflow-hidden aspect-[4/3] cursor-pointer floating-photo group bg-[#0e1710]"
              >
                {AMBIENTE_SLIDES.map((slide, idx) => (
                  <img
                    key={slide.id}
                    src={slide.image}
                    alt={slide.alt}
                    className={`absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-all duration-700 ease-in-out ${
                      idx === activeAmbienteIndex 
                        ? 'opacity-100 z-10' 
                        : 'opacity-0 z-0 pointer-events-none'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                ))}

                {/* Ícone de zoom */}
                <div className="absolute top-2.5 right-2.5 bg-black/60 p-1.5 rounded-full text-white/80 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <Maximize2 size={12} />
                </div>
              </div>

              {/* Legenda Sincronizada com Fundo Pontual Mínimo */}
              <div className="mt-3.5 text-center min-h-[48px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeAmbienteIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="text-contrast-pill inline-block"
                  >
                    <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider block">
                      {AMBIENTE_SLIDES[activeAmbienteIndex].tag}
                    </span>
                    <h4 className="font-display font-bold text-sm sm:text-base text-white title-shadow leading-snug">
                      {AMBIENTE_SLIDES[activeAmbienteIndex].title}
                    </h4>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Indicadores de Posição (Dots) */}
              <div className="mt-3 flex justify-center items-center gap-1.5">
                {AMBIENTE_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleManualAmbienteChange(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeAmbienteIndex 
                        ? 'w-5 bg-[#D4AF37]' 
                        : 'w-1.5 bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. SEÇÃO ESPAÇO KIDS — TESTE DE DIAGNÓSTICO */}
      <section 
        ref={sectionRefs.playground}
        className="section-translucent-dark py-10 sm:py-14 px-4 sm:px-6 border-t border-[#D4AF37]/10 relative z-10"
      >
        <div className="max-w-4xl mx-auto text-center">
          
          <div className="mb-6 flex flex-col items-center">
            <div className="text-contrast-box max-w-md mx-auto">
              <span className="text-[10px] sm:text-xs text-[#D4AF37] font-bold uppercase tracking-widest block mb-1">FAMÍLIA EM CAMPO</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display title-shadow leading-tight">ESPAÇO KIDS</h2>
              <div className="w-12 h-0.5 bg-[#B31217] mx-auto mt-2 mb-2" />
              <p className="text-xs text-[#E5E5E5] font-medium title-shadow">
                Diversão segura para os pequenos enquanto você curte o jogo com tranquilidade.
              </p>
            </div>
          </div>

          <div className="max-w-xl mx-auto flex flex-col items-center my-7 sm:my-9 space-y-6">
            {/* Foto Flutuante do Espaço Kids: sem container ao redor, ocupando 75-78% no mobile */}
            <div className="w-[78%] sm:w-[72%] max-w-[380px] mx-auto">
              <div className="relative overflow-hidden aspect-video floating-photo">
                <img 
                  src={playgroundKidsImg} 
                  className="w-full h-full object-cover" 
                  alt="Espaço Kids com Cama Elástica"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {/* Legenda com fundo pontual mínimo apenas atrás das palavras */}
              <div className="mt-3.5 text-center">
                <div className="text-contrast-pill inline-block">
                  <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider block">Área Recreativa</span>
                  <h4 className="font-display font-bold text-sm sm:text-base text-white title-shadow leading-snug">Cama Elástica & Brinquedos</h4>
                </div>
              </div>
            </div>

            {/* Botão de Reserva com espaçamento vertical aumentado */}
            <div className="pt-2">
              <a 
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Quero reservar uma mesa próxima ao Espaço Kids.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-[#B31217] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#920e12] border border-[#D4AF37]/30 transition-all shadow-xl font-display flex items-center justify-center gap-2 mx-auto active:scale-98"
              >
                <Phone size={13} />
                <span>RESERVAR PERTO DO KIDS</span>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* 7. SEÇÃO CONVERSÃO FINAL & LOCALIZAÇÃO — TESTE DE DIAGNÓSTICO */}
      <section 
        ref={sectionRefs.contato}
        className="relative section-translucent py-10 sm:py-14 px-4 sm:px-6 border-t border-[#D4AF37]/15 z-10 overflow-hidden"
      >
        <div className="max-w-4xl mx-auto relative z-10">
          
          <div className="grid md:grid-cols-2 gap-5 md:gap-8">
            
            {/* Card Casa do Torcedor */}
            <div className="card-translucent border border-[#D4AF37]/30 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-[#1F3D24] text-[#D4AF37] text-[8px] sm:text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest mb-3 border border-[#D4AF37]/20">
                  <span>🏆</span>
                  <span>CASA DO TORCEDOR</span>
                </div>
                
                <h3 className="text-lg sm:text-xl font-extrabold text-white font-display leading-tight mb-2 title-shadow">
                  SEU TIME. SUA MESA. SUA TORCIDA.
                </h3>
                <p className="text-xs text-[#E5E5E5] leading-relaxed mb-4">
                  Aqui todo jogo vira evento. Chama a galera e vem torcer com a gente.
                </p>
              </div>

              <a 
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Vi o Espeto F.C. no site e quero fazer uma reserva para torcer com a galera.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#B31217] text-white font-extrabold text-xs tracking-widest hover:bg-[#920e12] border border-[#D4AF37]/30 shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98 font-display"
              >
                <Phone size={13} />
                <span>FAZER RESERVA</span>
              </a>
            </div>

            {/* Informações Práticas de Localização */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="text-contrast-pill inline-block mb-1">
                <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest block mb-1">LOCALIZAÇÃO & HORÁRIOS</span>
                <h2 className="text-2xl font-extrabold text-white font-display mb-1 title-shadow leading-tight">COMO CHEGAR</h2>
                <p className="text-xs text-[#E5E5E5] title-shadow">Esperamos você para a próxima partida.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl card-translucent border border-[#D4AF37]/15">
                  <div className="w-8 h-8 rounded-lg bg-[#1F3D24] border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <MapPin size={15} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-white">Endereço</h4>
                    <p className="text-[11px] text-[#E5E5E5]">Av. Josefina Bechara Hage, 440 - São José do Rio Preto, SP</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl card-translucent border border-[#D4AF37]/15">
                  <div className="w-8 h-8 rounded-lg bg-[#1F3D24] border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <Clock size={15} />
                  </div>
                  <div className="w-full">
                    <h4 className="font-display font-bold text-xs text-white mb-1">Horários</h4>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-[#E5E5E5]">
                      <div>Seg: 17:30 – 23:30</div>
                      <div>Ter a Qui: 18:00 – 23:30</div>
                      <div>Sex e Sáb: 18:00 – 00:00</div>
                      <div className="text-red-400 font-semibold">Dom: Fechado</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent("Av. Josefina Bechara Hage, 440 - São José do Rio Preto, SP, 15046-689")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-[#142617] border border-[#D4AF37]/30 text-white hover:text-[#D4AF37] text-xs font-bold uppercase tracking-wider text-center font-display flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <span>MAPS</span>
                  <ChevronRight size={12} />
                </a>
                <a 
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-[#142617] border border-[#D4AF37]/30 text-white hover:text-[#D4AF37] text-xs font-bold uppercase tracking-wider text-center font-display flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <Instagram size={12} />
                  <span>@ESPETO.FC</span>
                </a>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* FOOTER — TESTE DE DIAGNÓSTICO */}
      <footer className="section-translucent-dark border-t border-[#D4AF37]/15 py-8 px-4 text-center mt-auto relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-2">
          <span className="text-lg font-extrabold font-display tracking-wider text-white">
            <span className="text-[#D4AF37]">ESPETO</span> <span className="text-[#D4AF37]">F.C.</span>
          </span>
          <p className="text-[10px] text-[#CCCCCC] leading-relaxed">
            © 2026 ESPETO F.C. • Proibida a venda de bebidas alcoólicas para menores de 18 anos.
          </p>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <a 
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Vim pelo site do Espeto F.C.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#B31217] hover:bg-[#920e12] text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 border-2 border-[#D4AF37]/30 relative"
          aria-label="Reservar pelo WhatsApp"
        >
          <Phone size={22} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 border border-white rounded-full flex items-center justify-center text-[7px] font-bold text-white animate-bounce">
            1
          </span>
        </a>
      </div>

      {/* Modal Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20"
              aria-label="Fechar lightbox"
            >
              <X size={20} />
            </button>
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={selectedImage} 
              alt="Ambiente Ampliado" 
              className="max-w-full max-h-[85vh] rounded-xl object-contain border border-[#D4AF37]/20 shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
