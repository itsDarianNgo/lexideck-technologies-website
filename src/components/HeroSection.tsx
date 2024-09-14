import React, { useEffect, useRef } from 'react';

const HeroSection: React.FC = () => {
    // Reference to the canvas element
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Text to display
    const textLines = useRef<string[]>([]);

    // Mouse interaction object
    const mouse = useRef({
        x: null as number | null,
        y: null as number | null,
        radius: 100, // Default radius
    });

    // Arrays for particles
    const particlesArray = useRef<Particle[]>([]);
    const ambientParticlesArray = useRef<AmbientParticle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Initial setup
        setupCanvas(canvas, ctx);

        // Animation loop
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update ambient particles
            ambientParticlesArray.current.forEach((particle) =>
                particle.update(ctx, canvas)
            );

            // Update text particles
            particlesArray.current.forEach((particle) =>
                particle.update(ctx, mouse.current, ambientParticlesArray.current)
            );
        };
        animate();

        // Event handlers
        const handleMouseMove = (event: MouseEvent) => {
            mouse.current.x = event.clientX;
            mouse.current.y = event.clientY;
        };

        const handleTouchMove = (event: TouchEvent) => {
            const touch = event.touches[0];
            if (touch) {
                mouse.current.x = touch.clientX;
                mouse.current.y = touch.clientY;
            }
        };

        const handleResize = () => {
            setupCanvas(canvas, ctx);
        };

        // Add event listeners
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Function to set interaction radius based on screen size
    const setInteractionRadius = () => {
        if (window.innerWidth < 600) {
            // Mobile devices
            mouse.current.radius = 50; // Adjust this value as needed
        } else {
            // Desktop devices
            mouse.current.radius = 100; // Adjust this value as needed
        }
    };

    // Function to set ambient particle count based on screen size
    const setAmbientParticleCount = (): number => {
        if (window.innerWidth < 600) {
            // Mobile devices
            return 50; // Fewer particles on mobile
        } else {
            // Desktop devices
            return 100; // More particles on desktop
        }
    };

    // Function to set font size based on screen size
    const setFontSize = (): number => {
        let fontSize: number;

        if (window.innerWidth < 600) {
            // Mobile devices
            fontSize = Math.min(40, window.innerWidth * 0.1);
        } else {
            // Desktop devices
            fontSize = Math.min(80, window.innerWidth * 0.05);
        }

        return fontSize;
    };

    // Function to set up canvas and initialize particles
    const setupCanvas = (
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ) => {
        // Set canvas dimensions
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Set interaction radius based on screen size
        setInteractionRadius();

        // Determine text lines based on screen width
        if (window.innerWidth < 600) {
            // For small screens, split text into two lines
            textLines.current = ['Lexideck', 'Technologies'];
        } else {
            // For larger screens, keep text on a single line
            textLines.current = ['Lexideck Technologies'];
        }

        // Initialize particles
        initParticles(ctx, canvas);
    };

    // Initialize particles based on the input text
    const initParticles = (
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement
    ) => {
        particlesArray.current = [];
        ambientParticlesArray.current = [];

        // Offscreen canvas for text rendering
        const textCanvas = document.createElement('canvas');
        const textCtx = textCanvas.getContext('2d');
        textCanvas.width = canvas.width;
        textCanvas.height = canvas.height;

        if (textCtx) {
            // Clear the offscreen canvas
            textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);

            // Side padding (in pixels)
            const sidePadding = 50; // Adjust this value as needed

            // Set font size based on screen dimensions
            const fontSize = setFontSize();

            // Set font and styles
            textCtx.font = `bold ${fontSize}px "Noto Sans Warang Citi", sans-serif`;
            textCtx.fillStyle = 'white';
            textCtx.textAlign = 'center';
            textCtx.textBaseline = 'middle';

            // Calculate starting Y position to center text vertically
            const lineHeight = fontSize * 1.2; // Adjust line height as needed
            const totalTextHeight = lineHeight * textLines.current.length;
            let textY = (textCanvas.height - totalTextHeight) / 2 + fontSize / 2;

            // Draw each line of text
            textLines.current.forEach((line) => {
                textCtx.fillText(line, textCanvas.width / 2, textY);
                textY += lineHeight;
            });

            // Get pixel data from the text canvas
            const textCoordinates = textCtx.getImageData(
                0,
                0,
                textCanvas.width,
                textCanvas.height
            );

            // Adjust particle spacing based on font size
            const particleGap = Math.max(2, Math.floor(fontSize / 25));

            // Create particles from text pixels
            for (let y = 0; y < textCoordinates.height; y += particleGap) {
                for (let x = 0; x < textCoordinates.width; x += particleGap) {
                    const index = y * 4 * textCoordinates.width + x * 4;
                    if (textCoordinates.data[index + 3] > 128) {
                        particlesArray.current.push(
                            new Particle(x, y, canvas.width, canvas.height)
                        );
                    }
                }
            }
        }

        // Determine ambient particle speed based on screen width
        let minSpeed: number;
        let maxSpeed: number;

        if (window.innerWidth < 600) {
            // For mobile devices, slow down the particles
            minSpeed = -0.2;
            maxSpeed = 0.2;
        } else {
            // For larger screens, normal speed
            minSpeed = -0.5;
            maxSpeed = 0.5;
        }

        // Get ambient particle count
        const numberOfAmbientParticles = setAmbientParticleCount();

        // Create ambient particles
        for (let i = 0; i < numberOfAmbientParticles; i++) {
            ambientParticlesArray.current.push(
                new AmbientParticle(
                    canvas.width,
                    canvas.height,
                    minSpeed,
                    maxSpeed
                )
            );
        }
    };

    // Particle class for text particles
    class Particle {
        x: number;
        y: number;
        baseX: number;
        baseY: number;
        size: number;
        color: string;
        density: number;
        z: number;

        constructor(
            x: number,
            y: number,
            canvasWidth: number,
            canvasHeight: number
        ) {
            this.x = Math.random() * canvasWidth;
            this.y = Math.random() * canvasHeight;
            this.baseX = x;
            this.baseY = y;
            this.size = 1.5;
            this.color = 'white';
            this.density = Math.random() * 30 + 1;
            this.z = Math.random() * 20;
        }

        // Draw the particle on the canvas
        draw(ctx: CanvasRenderingContext2D) {
            ctx.beginPath();
            ctx.arc(
                this.x,
                this.y,
                this.size + this.z / 10,
                0,
                Math.PI * 2,
                false
            );
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // Update particle position
        update(
            ctx: CanvasRenderingContext2D,
            mouse: { x: number | null; y: number | null; radius: number },
            ambientParticles: AmbientParticle[]
        ) {
            // Mouse interaction
            if (mouse.x !== null && mouse.y !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = mouse.radius;
                const force = (maxDistance - distance) / maxDistance;
                const directionX = (dx / distance) * force * this.density;
                const directionY = (dy / distance) * force * this.density;

                if (distance < mouse.radius) {
                    this.x -= directionX;
                    this.y -= directionY;
                } else {
                    // Move back to base position
                    this.x -= (this.x - this.baseX) / 10;
                    this.y -= (this.y - this.baseY) / 10;
                }
            } else {
                // Move back to base position
                this.x -= (this.x - this.baseX) / 10;
                this.y -= (this.y - this.baseY) / 10;
            }

            // Interaction with ambient particles
            ambientParticles.forEach((ambientParticle) => {
                const dx = ambientParticle.x - this.x;
                const dy = ambientParticle.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 20) {
                    const forceX = dx / distance;
                    const forceY = dy / distance;
                    this.x -= forceX;
                    this.y -= forceY;
                }
            });

            this.draw(ctx);
        }
    }

    // Ambient particle class for background effect
    class AmbientParticle {
        x: number;
        y: number;
        size: number;
        color: string;
        speedX: number;
        speedY: number;

        constructor(
            canvasWidth: number,
            canvasHeight: number,
            minSpeed: number,
            maxSpeed: number
        ) {
            this.x = Math.random() * canvasWidth;
            this.y = Math.random() * canvasHeight;
            this.size = Math.random() * 2 + 1;
            this.color = 'rgba(255,255,255,0.5)';
            // Adjusted speed using minSpeed and maxSpeed
            this.speedX = Math.random() * (maxSpeed - minSpeed) + minSpeed;
            this.speedY = Math.random() * (maxSpeed - minSpeed) + minSpeed;
        }

        // Draw the ambient particle
        draw(ctx: CanvasRenderingContext2D) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // Update position and wrap around edges
        update(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
            this.x += this.speedX;
            this.y += this.speedY;

            // Wrap around the edges
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;

            this.draw(ctx);
        }
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Canvas element for the particle animation */}
            <canvas ref={canvasRef} className="block"></canvas>
        </div>
    );
};

export default HeroSection;
