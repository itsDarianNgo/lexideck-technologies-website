import React, { useEffect, useRef, useState } from 'react';

const HeroSection: React.FC = () => {
    // Reference to the canvas element
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // State to track screen width
    const [screenWidth, setScreenWidth] = useState<number | null>(null);

    // Determine if the device is mobile
    const isMobile = screenWidth !== null ? screenWidth <= 768 : false; // Adjust breakpoint as needed

    // Text lines to display
    const textLines = isMobile
        ? ['Lexideck', 'Technologies']
        : ['Lexideck Technologies'];

    // Mouse interaction object
    const mouse = useRef({
        x: null as number | null,
        y: null as number | null,
        radius: 100,
    });

    // Arrays for particles
    const particlesArray = useRef<Particle[]>([]);
    const ambientParticlesArray = useRef<AmbientParticle[]>([]);

    useEffect(() => {
        // Check if window is defined
        if (typeof window !== 'undefined') {
            // Update screen width
            setScreenWidth(window.innerWidth);

            const handleResize = () => {
                setScreenWidth(window.innerWidth);
            };

            // Add event listener for window resize
            window.addEventListener('resize', handleResize);

            // Cleanup
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    }, []);

    useEffect(() => {
        // Ensure screenWidth is set before proceeding
        if (screenWidth !== null) {
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

            // Add event listener for mouse movement
            window.addEventListener('mousemove', handleMouseMove);

            // Cleanup function
            return () => {
                cancelAnimationFrame(animationFrameId);
                window.removeEventListener('mousemove', handleMouseMove);
            };
        }
    }, [screenWidth, textLines]);

    // Function to set up canvas and initialize particles
    const setupCanvas = (
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ) => {
        // Set canvas dimensions
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Initialize particles
        initParticles(ctx, canvas);
    };

    // Initialize particles based on the text lines
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

            // Set font size based on canvas dimensions and padding
            const maxTextWidth = canvas.width - sidePadding * 2;

            // Base scaling factor adjusted for mobile
            const scalingFactor = isMobile ? 0.12 : 0.1;

            // Set initial font size
            let fontSize = scalingFactor * Math.min(canvas.width, canvas.height);

            // Set minimum and maximum font sizes
            const minFontSize = 30;
            const maxFontSize = isMobile ? 80 : 100;

            // Adjust font size to fit within the maxTextWidth
            textCtx.font = `bold ${fontSize}px Arial`;
            let textMetrics = textCtx.measureText(textLines[0]);
            while (textMetrics.width > maxTextWidth && fontSize > minFontSize) {
                fontSize -= 1;
                textCtx.font = `bold ${fontSize}px Arial`;
                textMetrics = textCtx.measureText(textLines[0]);
            }
            fontSize = Math.min(fontSize, maxFontSize);

            // Set font and styles
            textCtx.font = `bold ${fontSize}px Arial`;
            textCtx.fillStyle = 'white';
            textCtx.textAlign = 'center';
            textCtx.textBaseline = 'middle';

            // Calculate vertical positioning for multiple lines
            const lineHeight = fontSize * 1.2; // Adjust line height as needed
            const totalTextHeight = lineHeight * textLines.length;
            const startY = (textCanvas.height - totalTextHeight) / 2 + fontSize / 2;

            // Draw each line of text
            textLines.forEach((line, index) => {
                const textX = textCanvas.width / 2;
                const textY = startY + index * lineHeight;
                textCtx.fillText(line, textX, textY);
            });

            // Get pixel data from the text canvas
            const textCoordinates = textCtx.getImageData(
                0,
                0,
                textCanvas.width,
                textCanvas.height
            );

            // Adjust particle spacing and size based on screen size
            const particleGap = isMobile ? 3 : 4; // Smaller gap for more particles on mobile
            const particleSize = isMobile ? 2 : 1.5; // Larger particles on mobile

            // Create particles from text pixels
            for (let y = 0; y < textCoordinates.height; y += particleGap) {
                for (let x = 0; x < textCoordinates.width; x += particleGap) {
                    const index = (y * 4 * textCoordinates.width) + (x * 4);
                    if (textCoordinates.data[index + 3] > 128) {
                        particlesArray.current.push(
                            new Particle(
                                x,
                                y,
                                canvas.width,
                                canvas.height,
                                particleSize
                            )
                        );
                    }
                }
            }
        }

        // Create ambient particles
        const numberOfAmbientParticles = 100;
        for (let i = 0; i < numberOfAmbientParticles; i++) {
            ambientParticlesArray.current.push(
                new AmbientParticle(canvas.width, canvas.height, isMobile)
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
            canvasHeight: number,
            particleSize: number
        ) {
            this.x = Math.random() * canvasWidth;
            this.y = Math.random() * canvasHeight;
            this.baseX = x;
            this.baseY = y;
            this.size = particleSize;
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
            isMobile: boolean
        ) {
            this.x = Math.random() * canvasWidth;
            this.y = Math.random() * canvasHeight;
            this.size = Math.random() * (isMobile ? 3 : 2) + 1;
            this.color = 'rgba(255,255,255,0.5)';
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
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

    // Render nothing until screenWidth is set
    if (screenWidth === null) {
        return null;
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Canvas element for the particle animation */}
            <canvas ref={canvasRef} className="block"></canvas>
        </div>
    );
};

export default HeroSection;
