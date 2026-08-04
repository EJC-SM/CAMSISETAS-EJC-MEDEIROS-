import { el } from '../utils/dom';

export interface FotoSlide {
  src: string;
  alt: string;
}

export interface FotoCarouselOptions {
  className?: string;
  /** Impede que cliques nos controles disparem handlers do elemento pai. */
  stopPropagation?: boolean;
}

export function renderFotoCarousel(slides: FotoSlide[], options: FotoCarouselOptions = {}): HTMLElement {
  const { className = '', stopPropagation = false } = options;
  const rootClass = ['foto-carousel', className].filter(Boolean).join(' ');

  if (slides.length === 0) {
    return el('div', { class: `${rootClass} foto-carousel--empty` }, [
      el('span', { class: 'foto-carousel__placeholder' }, ['👕']),
    ]);
  }

  if (slides.length === 1) {
    return el('div', { class: rootClass }, [
      el('img', {
        class: 'foto-carousel__img',
        src: slides[0].src,
        alt: slides[0].alt,
        loading: 'lazy',
        width: 280,
        height: 280,
      }),
    ]);
  }

  let index = 0;
  const track = el('div', { class: 'foto-carousel__track' });
  for (const slide of slides) {
    track.appendChild(
      el('div', { class: 'foto-carousel__slide' }, [
        el('img', {
          class: 'foto-carousel__img',
          src: slide.src,
          alt: slide.alt,
          loading: 'lazy',
          width: 280,
          height: 280,
        }),
      ]),
    );
  }

  const viewport = el('div', { class: 'foto-carousel__viewport' }, [track]);
  const dotsWrap = el('div', { class: 'foto-carousel__dots', role: 'tablist' });
  const dotButtons: HTMLButtonElement[] = [];

  const prevBtn = el(
    'button',
    {
      class: 'foto-carousel__nav foto-carousel__nav--prev',
      type: 'button',
      'aria-label': 'Foto anterior',
    },
    ['‹'],
  ) as HTMLButtonElement;
  const nextBtn = el(
    'button',
    {
      class: 'foto-carousel__nav foto-carousel__nav--next',
      type: 'button',
      'aria-label': 'Próxima foto',
    },
    ['›'],
  ) as HTMLButtonElement;

  function goTo(nextIndex: number): void {
    index = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dotButtons.forEach((btn, i) => {
      const active = i === index;
      btn.classList.toggle('foto-carousel__dot--active', active);
      btn.setAttribute('aria-selected', String(active));
    });
  }

  slides.forEach((slide, i) => {
    const dot = el(
      'button',
      {
        class: `foto-carousel__dot${i === 0 ? ' foto-carousel__dot--active' : ''}`,
        type: 'button',
        role: 'tab',
        'aria-label': slide.alt,
        'aria-selected': i === 0 ? 'true' : 'false',
      },
      [],
    ) as HTMLButtonElement;
    dot.addEventListener('click', (event) => {
      if (stopPropagation) event.stopPropagation();
      goTo(i);
    });
    dotButtons.push(dot);
    dotsWrap.appendChild(dot);
  });

  const bindNav = (btn: HTMLButtonElement, delta: number): void => {
    btn.addEventListener('click', (event) => {
      if (stopPropagation) event.stopPropagation();
      goTo(index + delta);
    });
  };
  bindNav(prevBtn, -1);
  bindNav(nextBtn, 1);

  return el('div', { class: rootClass }, [prevBtn, viewport, nextBtn, dotsWrap]);
}

/** Monta slides frente/costas a partir das chaves do produto. */
export function slidesProduto(
  fotoKey: string,
  fotoKeyCostas: string | undefined,
  resolver: (key: string) => string | null,
  tipo: string,
): FotoSlide[] {
  const slides: FotoSlide[] = [];
  const frente = resolver(fotoKey);
  if (frente) slides.push({ src: frente, alt: `${tipo} — frente` });
  if (fotoKeyCostas) {
    const costas = resolver(fotoKeyCostas);
    if (costas) slides.push({ src: costas, alt: `${tipo} — costas` });
  }
  return slides;
}
