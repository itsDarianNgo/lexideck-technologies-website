export interface Mouse {
    x: number | null;
    y: number | null;
    radius: number;
}

export interface Particle {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    size: number;
    color: string;
    density: number;
    z: number;
    draw: (ctx: CanvasRenderingContext2D) => void;
    update: (
        ctx: CanvasRenderingContext2D,
        mouse: Mouse,
        particlesArray: Particle[],
        ambientParticlesArray: AmbientParticle[]
    ) => void;
}

export interface AmbientParticle {
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    draw: (ctx: CanvasRenderingContext2D) => void;
    update: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
}
