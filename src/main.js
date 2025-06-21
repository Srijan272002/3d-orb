import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class OrbScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.controls = null;
        
        // Animation properties
        this.animationSettings = {
            rotationSpeed: { x: 0.3, y: 0.5 },
            bobbing: { enabled: true, speed: 1.5, amplitude: 0.3 },
            pulsing: { enabled: true, speed: 2.0, amplitude: 0.2 },
            colorTransition: { enabled: true, speed: 0.8 }
        };
        
        this.init();
        this.createSphere();
        this.createParticleSystem();
        this.setupLights();
        this.setupCameraControls();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Get canvas element
        this.canvas = document.getElementById('canvas');
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        this.camera.position.z = 5;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        console.log('Three.js scene initialized successfully');
    }

    createSphere() {
        // Create sphere geometry with optimized segments
        const geometry = new THREE.SphereGeometry(
            1.5, // radius
            32,  // width segments (good balance of detail vs performance)
            32   // height segments (good balance of detail vs performance)
        );

        // Create advanced PBR material with multiple options
        const material = new THREE.MeshStandardMaterial({
            color: 0x4a90e2,
            metalness: 0.3,
            roughness: 0.4,
            wireframe: false,
            envMapIntensity: 1.0,
            // Add subtle emissive glow
            emissive: new THREE.Color(0x001122),
            emissiveIntensity: 0.1
        });

        // Create mesh and enable shadows
        this.sphere = new THREE.Mesh(geometry, material);
        this.sphere.castShadow = true;
        this.sphere.receiveShadow = true;
        this.scene.add(this.sphere);

        // Store geometry and material for potential manipulation
        this.sphereGeometry = geometry;
        this.sphereMaterial = material;

        // Create alternative materials for different effects
        this.alternativeMaterials = {
            wireframe: new THREE.MeshStandardMaterial({
                color: 0x4a90e2,
                wireframe: true,
                transparent: true,
                opacity: 0.8
            }),
            basic: new THREE.MeshBasicMaterial({
                color: 0x4a90e2,
                wireframe: false
            }),
            lambert: new THREE.MeshLambertMaterial({
                color: 0x4a90e2
            }),
            phong: new THREE.MeshPhongMaterial({
                color: 0x4a90e2,
                shininess: 100,
                specular: 0x1188ff
            })
        };
        
        console.log('Advanced sphere created with multiple material options and shadow support');
    }

    createParticleSystem() {
        // Create particle geometry
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        // Generate random particles around the sphere
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random spherical distribution
            const radius = 3 + Math.random() * 4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Random colors
            const color = new THREE.Color();
            color.setHSL(Math.random() * 0.6 + 0.5, 0.7, 0.8);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // Random sizes
            sizes[i] = Math.random() * 3 + 1;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create particle material
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        // Create particle system
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
        
        // Store original positions for animation
        this.originalParticlePositions = positions.slice();
        
        console.log('Particle system created with 200 particles');
    }

    setupLights() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional light for main illumination with shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        this.scene.add(directionalLight);

        // Point light for additional highlight
        const pointLight = new THREE.PointLight(0x80a0ff, 0.6);
        pointLight.position.set(-3, 2, 3);
        pointLight.castShadow = true;
        this.scene.add(pointLight);

        // Spot light for dramatic effect
        const spotLight = new THREE.SpotLight(0xffffff, 0.8);
        spotLight.position.set(-5, 5, 2);
        spotLight.target = this.sphere;
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.3;
        spotLight.decay = 2;
        spotLight.distance = 200;
        spotLight.castShadow = true;
        this.scene.add(spotLight);

        // Light helpers for debugging (can be toggled)
        this.lightHelpers = {
            directional: new THREE.DirectionalLightHelper(directionalLight, 1),
            point: new THREE.PointLightHelper(pointLight, 0.3),
            spot: new THREE.SpotLightHelper(spotLight)
        };

        // Add helpers to scene (hidden by default)
        Object.values(this.lightHelpers).forEach(helper => {
            helper.visible = false;
            this.scene.add(helper);
        });

        // Store lights for potential manipulation
        this.lights = {
            ambient: ambientLight,
            directional: directionalLight,
            point: pointLight,
            spot: spotLight
        };
        
        console.log('Advanced lighting setup complete with shadows and helpers');
    }

    setupCameraControls() {
        // Initialize OrbitControls for camera interaction
        this.controls = new OrbitControls(this.camera, this.canvas);
        
        // Configure control settings
        this.controls.enableDamping = true; // Smooth camera movement
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        
        // Set control limits
        this.controls.minDistance = 3;
        this.controls.maxDistance = 12;
        this.controls.maxPolarAngle = Math.PI; // Allow full vertical rotation
        
        // Auto rotation settings
        this.controls.autoRotate = false; // Can be toggled
        this.controls.autoRotateSpeed = 1.0;
        
        // Touch/mouse sensitivity
        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.8;
        
        console.log('Camera controls (OrbitControls) configured');
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Basic mouse interaction (simple rotation)
        let mouseX = 0;
        let mouseY = 0;
        
        window.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        // Apply mouse influence in animation loop
        this.mouseInfluence = { x: 0, y: 0 };
        
        window.addEventListener('mousemove', (event) => {
            this.mouseInfluence.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouseInfluence.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // Add keyboard controls for material switching and light helpers
        window.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });
        
        console.log('Event listeners configured with keyboard controls');
    }

    handleResize() {
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        console.log('Window resized - camera and renderer updated');
    }

    handleKeyPress(event) {
        switch(event.key.toLowerCase()) {
            case '1':
                // Switch to standard material
                this.sphere.material = this.sphereMaterial;
                console.log('Switched to Standard Material (PBR)');
                break;
            case '2':
                // Switch to wireframe
                this.sphere.material = this.alternativeMaterials.wireframe;
                console.log('Switched to Wireframe Material');
                break;
            case '3':
                // Switch to basic material
                this.sphere.material = this.alternativeMaterials.basic;
                console.log('Switched to Basic Material');
                break;
            case '4':
                // Switch to lambert material
                this.sphere.material = this.alternativeMaterials.lambert;
                console.log('Switched to Lambert Material');
                break;
            case '5':
                // Switch to phong material
                this.sphere.material = this.alternativeMaterials.phong;
                console.log('Switched to Phong Material');
                break;
            case 'h':
                // Toggle light helpers
                this.toggleLightHelpers();
                break;
            case 's':
                // Toggle shadows
                this.toggleShadows();
                break;
            case 'a':
                // Toggle auto rotation
                this.toggleAutoRotate();
                break;
            case 'b':
                // Toggle bobbing animation
                this.toggleBobbing();
                break;
            case 'p':
                // Toggle pulsing animation
                this.togglePulsing();
                break;
            case 'c':
                // Toggle color transition
                this.toggleColorTransition();
                break;
            case 'r':
                // Reset camera position
                this.resetCamera();
                break;
            case 'e':
                // Toggle particle effects
                this.toggleParticles();
                break;
        }
    }

    toggleLightHelpers() {
        const helpersVisible = this.lightHelpers.directional.visible;
        Object.values(this.lightHelpers).forEach(helper => {
            helper.visible = !helpersVisible;
        });
        console.log(`Light helpers ${helpersVisible ? 'hidden' : 'shown'}`);
    }

    toggleShadows() {
        this.renderer.shadowMap.enabled = !this.renderer.shadowMap.enabled;
        console.log(`Shadows ${this.renderer.shadowMap.enabled ? 'enabled' : 'disabled'}`);
    }

    toggleAutoRotate() {
        this.controls.autoRotate = !this.controls.autoRotate;
        console.log(`Auto rotation ${this.controls.autoRotate ? 'enabled' : 'disabled'}`);
    }

    toggleBobbing() {
        this.animationSettings.bobbing.enabled = !this.animationSettings.bobbing.enabled;
        console.log(`Bobbing animation ${this.animationSettings.bobbing.enabled ? 'enabled' : 'disabled'}`);
    }

    togglePulsing() {
        this.animationSettings.pulsing.enabled = !this.animationSettings.pulsing.enabled;
        console.log(`Pulsing animation ${this.animationSettings.pulsing.enabled ? 'enabled' : 'disabled'}`);
    }

    toggleColorTransition() {
        this.animationSettings.colorTransition.enabled = !this.animationSettings.colorTransition.enabled;
        console.log(`Color transition ${this.animationSettings.colorTransition.enabled ? 'enabled' : 'disabled'}`);
    }

    resetCamera() {
        this.controls.reset();
        console.log('Camera position reset');
    }

    toggleParticles() {
        if (this.particles) {
            this.particles.visible = !this.particles.visible;
            console.log(`Particle effects ${this.particles.visible ? 'enabled' : 'disabled'}`);
        }
    }

    animate() {
        // Create animation loop
        const clock = new THREE.Clock();
        
        const animateLoop = () => {
            const elapsedTime = clock.getElapsedTime();
            
            // Update controls
            this.controls.update();
            
            // Apply animations to sphere
            if (this.sphere) {
                // Basic rotation
                this.sphere.rotation.x = elapsedTime * this.animationSettings.rotationSpeed.x;
                this.sphere.rotation.y = elapsedTime * this.animationSettings.rotationSpeed.y;
                
                // Add subtle mouse interaction (reduced when OrbitControls are active)
                const mouseInfluence = this.controls.autoRotate ? 0.1 : 0.2;
                this.sphere.rotation.x += this.mouseInfluence.y * mouseInfluence;
                this.sphere.rotation.y += this.mouseInfluence.x * mouseInfluence;
                
                // Bobbing/floating animation
                if (this.animationSettings.bobbing.enabled) {
                    this.sphere.position.y = Math.sin(elapsedTime * this.animationSettings.bobbing.speed) * 
                                           this.animationSettings.bobbing.amplitude;
                }
                
                // Pulsing scale effect
                if (this.animationSettings.pulsing.enabled) {
                    const pulseScale = 1 + Math.sin(elapsedTime * this.animationSettings.pulsing.speed) * 
                                      this.animationSettings.pulsing.amplitude;
                    this.sphere.scale.set(pulseScale, pulseScale, pulseScale);
                }
                
                // Color transition effect
                if (this.animationSettings.colorTransition.enabled && this.sphere.material.color) {
                    const hue = (elapsedTime * this.animationSettings.colorTransition.speed * 0.1) % 1;
                    this.sphere.material.color.setHSL(hue, 0.7, 0.6);
                }
            }

            // Animate particles
            if (this.particles && this.particles.visible) {
                this.particles.rotation.y = elapsedTime * 0.2;
                
                // Make particles gently float
                const positions = this.particles.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    const originalX = this.originalParticlePositions[i];
                    const originalY = this.originalParticlePositions[i + 1];
                    const originalZ = this.originalParticlePositions[i + 2];
                    
                    positions[i] = originalX + Math.sin(elapsedTime * 0.5 + originalX) * 0.1;
                    positions[i + 1] = originalY + Math.cos(elapsedTime * 0.7 + originalY) * 0.1;
                    positions[i + 2] = originalZ + Math.sin(elapsedTime * 0.3 + originalZ) * 0.1;
                }
                this.particles.geometry.attributes.position.needsUpdate = true;
            }

            // Render scene
            this.renderer.render(this.scene, this.camera);
            
            // Continue animation loop
            requestAnimationFrame(animateLoop);
        };
        
        animateLoop();
        console.log('Enhanced animation loop started with multiple effects');
    }
}

// Initialize the orb scene when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Three.js Orb Scene...');
    new OrbScene();
}); 