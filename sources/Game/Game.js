import * as THREE from 'three/webgpu'

import { Debug } from './Debug.js'
import { Inputs } from './Inputs/Inputs.js'
import { Physics } from './Physics/Physics.js'
import { Rendering } from './Rendering.js'
import { ResourcesLoader } from './ResourcesLoader.js'
import { Ticker } from './Ticker.js'
import { Time } from './Time.js'
import { Player } from './Player.js'
import { View } from './View.js'
import { Viewport } from './Viewport.js'
import { World } from './World/World.js'
import { Tracks } from './Tracks.js'
// import { Monitoring } from './Monitoring.js'
import { Lighting } from './Ligthing.js'
import { Materials } from './Materials.js'
import { Objects } from './Objects.js'
import { Fog } from './Fog.js'
import { DayCycles } from './Cycles/DayCycles.js'
import { Weather } from './Weather.js'
import { Noises } from './Noises.js'
import { Wind } from './Wind.js'
import { Terrain } from './Terrain.js'
import { Explosions } from './Explosions.js'
import { YearCycles } from './Cycles/YearCycles.js'
import { Server } from './Server.js'
import { Modals } from './Modals.js'
import { PhysicsVehicle } from './Physics/PhysicsVehicle.js'
import { PhysicsWireframe } from './Physics/PhysicsWireframe.js'
import { Zones } from './Zones.js'
import { Overlay } from './Overlay.js'
import { Tornado } from './Tornado.js'
import { InteractivePoints } from './InteractivePoints.js'
import { Respawns } from './Respawns.js'
import { Audio } from './Audio.js'
import { ClosingManager } from './ClosingManager.js'
import { RayCursor } from './RayCursor.js'
import { Water } from './Water.js'
import { Reveal } from './Reveal.js'
import { KonamiCode } from './KonamiCode.js'
import { Achievements } from './Achievements.js'
import { Notifications } from './Notifications.js'
import { Quality } from './Quality.js'
import { Menu } from './Menu.js'
import { Title } from './Title.js'
import { PreRenderer } from './PreRenderer.js'
import { Options } from './Options.js'
import gsap from 'gsap'
import { Map } from './Map.js'

export class Game
{
    static getInstance()
    {
        return Game.instance
    }

    constructor()
    {
        // Singleton
        if(Game.instance)
            return Game.instance

        Game.instance = this

        this.init()
    }

    async init()
    {
        // Setup
        this.domElement = document.querySelector('.game')
        this.canvasElement = this.domElement.querySelector('.js-canvas')
        document.documentElement.classList.add('is-started')

        // First batch for intro
        this.scene = new THREE.Scene()
        this.debug = new Debug()
        this.resourcesLoader = new ResourcesLoader()
        this.quality = new Quality()
        this.server = new Server()
        this.ticker = new Ticker()
        this.time = new Time()
        this.dayCycles = new DayCycles()
        this.yearCycles = new YearCycles()
        this.inputs = new Inputs([], [ 'intro' ])
        this.audio = new Audio()
        this.notifications = new Notifications()
        this.rayCursor = new RayCursor()
        this.viewport = new Viewport(this.domElement)
        this.modals = new Modals()
        this.menu = new Menu()
        this.rendering = new Rendering()
        await this.rendering.setRenderer()

        const compressed = !!import.meta.env.VITE_COMPRESSED
        const compressedModelSuffix = compressed ? '-compressed' : ''
        const compressedTextureFormat = compressed ? 'textureKtx' : 'texture'
        const compressedTextureExtension = compressed ? 'ktx' : 'png'

        this.resources = await this.resourcesLoader.load([
            [ 'respawnsReferencesModel',    `respawns/respawnsReferences${compressedModelSuffix}.glb`, 'gltf' ],
            [ 'behindTheSceneStarsTexture', `behindTheScene/stars.${compressedTextureExtension}`,      compressedTextureFormat, (resource) => { resource.colorSpace = THREE.SRGBColorSpace; resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; resource.wrapS = THREE.RepeatWrapping; resource.wrapT = THREE.RepeatWrapping; } ],
            [ 'soundTexture',               `intro/sound.${compressedTextureExtension}`,               compressedTextureFormat, (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.repeat.x = 0.5; } ],
            [ 'paletteTexture',             `palette.${compressedTextureExtension}`,                   compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; resource.colorSpace = THREE.SRGBColorSpace; } ],

        ])
        this.options = new Options()
        this.respawns = new Respawns(import.meta.env.VITE_PLAYER_SPAWN || 'landing')
        this.view = new View()
        this.rendering.setPostprocessing()
        this.rendering.start()
        this.reveal = new Reveal()
        this.noises = new Noises()
        this.weather = new Weather()
        this.wind = new Wind()
        this.tracks = new Tracks()
        this.lighting = new Lighting()
        this.fog = new Fog()
        this.water = new Water()
        this.materials = new Materials()
        this.objects = new Objects()
        this.explosions = new Explosions()
        this.world = new World()

        // Load and init RAPIER
        const rapierPromise = import('@dimforge/rapier3d')

        // Load rest of resources
        const resourcesPromise = this.resourcesLoader.load(
            [
                [ 'foliageTexture',                        `foliage/foliageSDF.${compressedTextureExtension}`,                              compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; } ],
                [ 'bushesReferences',                      `bushes/bushesReferences${compressedModelSuffix}.glb`,                           'gltf' ],
                [ 'vehicle',                               `vehicle/default${compressedModelSuffix}.glb`,                                   'gltf' ],
                [ 'playgroundVisual',                      `playground/playgroundVisual${compressedModelSuffix}.glb`,                       'gltf' ],
                [ 'playgroundPhysical',                    `playground/playgroundPhysical${compressedModelSuffix}.glb`,                     'gltf' ],
                [ 'flowersReferencesModel',                `flowers/flowersReferences${compressedModelSuffix}.glb`,                         'gltf' ],
                [ 'bricksModel',                           `bricks/bricks${compressedModelSuffix}.glb`,                                     'gltf' ],
                [ 'fencesModel',                           `fences/fences${compressedModelSuffix}.glb`,                                     'gltf' ],
                [ 'benchesModel',                          `benches/benches${compressedModelSuffix}.glb`,                                   'gltf' ],
                [ 'explosiveCratesModel',                  `explosiveCrates/explosiveCrates${compressedModelSuffix}.glb`,                   'gltf' ],
                [ 'lanternsModel',                         `lanterns/lanterns${compressedModelSuffix}.glb`,                                 'gltf' ],
                [ 'terrainTexture',                        `terrain/terrain.${compressedTextureExtension}`,                                 compressedTextureFormat, (resource) => { resource.flipY = false; } ],
                [ 'terrainModel',                          `terrain/terrain${compressedModelSuffix}.glb`,                                   'gltf' ],
                [ 'floorSlabsTexture',                     `floor/slabs.${compressedTextureExtension}`,                                     compressedTextureFormat, (resource) => { resource.wrapS = THREE.RepeatWrapping; resource.wrapT = THREE.RepeatWrapping; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false } ],
                [ 'birchTreesVisualModel',                 `birchTrees/birchTreesVisual${compressedModelSuffix}.glb`,                       'gltf' ],
                [ 'birchTreesReferencesModel',             `birchTrees/birchTreesReferences${compressedModelSuffix}.glb`,                   'gltf' ],
                [ 'oakTreesVisualModel',                   `oakTrees/oakTreesVisual${compressedModelSuffix}.glb`,                           'gltf' ],
                [ 'oakTreesReferencesModel',               `oakTrees/oakTreesReferences${compressedModelSuffix}.glb`,                                               'gltf' ],
                [ 'cherryTreesVisualModel',                `cherryTrees/cherryTreesVisual${compressedModelSuffix}.glb`,                     'gltf' ],
                [ 'cherryTreesReferencesModel',            `cherryTrees/cherryTreesReferences${compressedModelSuffix}.glb`,                 'gltf' ],
                [ 'sceneryModel',                          `scenery/scenery${compressedModelSuffix}.glb`,                                   'gltf' ],
                [ 'areasModel',                            `areas/areas${compressedModelSuffix}.glb`,                                       'gltf' ],
                [ 'poleLightsModel',                       `poleLights/poleLights${compressedModelSuffix}.glb`,                             'gltf' ],
                [ 'whisperFlameTexture',                   `whispers/whisperFlame.${compressedTextureExtension}`,                           compressedTextureFormat, (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false } ],
                [ 'satanStarTexture',                      `areas/satanStar.${compressedTextureExtension}`,                                 compressedTextureFormat, (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false } ],
                [ 'tornadoPathReferencesModel',            `tornado/tornadoPathReferences${compressedModelSuffix}.glb`,                     'gltf' ],
                [ 'overlayPatternTexture',                 `overlay/overlayPattern.${compressedTextureExtension}`,                          compressedTextureFormat, (resource) => { resource.wrapS = THREE.RepeatWrapping; resource.wrapT = THREE.RepeatWrapping; resource.magFilter = THREE.NearestFilter; resource.minFilter = THREE.NearestFilter; resource.generateMipmaps = false } ],
                [ 'interactivePointsKeyIconCrossTexture',  `interactivePoints/interactivePointsKeyIconCross.${compressedTextureExtension}`, compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false } ],
                [ 'interactivePointsKeyIconEnterTexture',  `interactivePoints/interactivePointsKeyIconEnter.${compressedTextureExtension}`, compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false } ],
                [ 'interactivePointsKeyIconATexture',      `interactivePoints/interactivePointsKeyIconA.${compressedTextureExtension}`,     compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false } ],
                [ 'jukeboxMusicNotes',                     `jukebox/jukeboxMusicNotes.${compressedTextureExtension}`,                       compressedTextureFormat, (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false } ],
                [ 'achievementsGlyphsTexture',             `achievements/glyphs.${compressedTextureExtension}`,                             compressedTextureFormat, (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.RepeatWrapping; } ],
                [ 'careerFreelancerTexture',               `career/careerFreelancer.${compressedTextureExtension}`,                         compressedTextureFormat, (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerHeticTexture',                    `career/careerHetic.${compressedTextureExtension}`,                              compressedTextureFormat, (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerImmersiveGardenTexture',          `career/careerImmersiveGarden.${compressedTextureExtension}`,                    compressedTextureFormat, (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerIRLTeacherTexture',               `career/careerIRLTeacher.${compressedTextureExtension}`,                         compressedTextureFormat, (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerOnlineTeacherTexture',            `career/careerOnlineTeacher.${compressedTextureExtension}`,                      compressedTextureFormat, (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerUzikTexture',                     `career/careerUzik.${compressedTextureExtension}`,                               compressedTextureFormat, (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'timeMachineScreenMGSTexture',           `timeMachine/timeMachineScreenMGS.${compressedTextureExtension}`,                compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; resource.colorSpace = THREE.SRGBColorSpace; } ],
                [ 'timeMachineScreenFolioTexture',         `timeMachine/timeMachineScreenFolio.${compressedTextureExtension}`,              compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; resource.colorSpace = THREE.SRGBColorSpace; } ],
            ],
            (toLoad, total) =>
            {
                this.world.intro.updateProgress(1 - toLoad / total)
            }
        )

        const [ newResources, RAPIER ] = await Promise.all([ resourcesPromise, rapierPromise ])
        this.RAPIER = RAPIER
        this.resources = { ...newResources, ...this.resources }

        this.terrain = new Terrain()
        this.physics = new Physics()
        this.wireframe = new PhysicsWireframe()
        this.physicalVehicle = new PhysicsVehicle()
        this.zones = new Zones()
        this.player = new Player()
        this.closingManager = new ClosingManager()
        this.interactivePoints = new InteractivePoints()
        this.konamiCode = new KonamiCode()
        this.achievements = new Achievements()
        this.tornado = new Tornado()
        this.map = new Map()
        this.title = new Title()
        // this.monitoring = new Monitoring()
        this.world.step(1)
        this.overlay = new Overlay()

        // Pre-render if quality high
        if(this.quality.level === 0 && this.rendering.renderer.backend.isWebGPUBackend)
            PreRenderer.render()

        this.ticker.wait(3, () =>
        {
            this.reveal.updateStep(0)
        })

        // Debug achievement
        if(this.debug.active)
        {
            this.achievements.setProgress('debug', 1)
        }
    }

    reset()
    {
        // Interactive buttons
        this.inputs.interactiveButtons.clearItems()

        // Player respawn
        this.player.respawn(null, () =>
        {
            // Objects reset
            this.objects.resetAll()

            // Explosive crates
            if(this.world.explosiveCrates)
                this.world.explosiveCrates.reset()

            // Bowling
            if(this.world.areas.bowling)
                this.world.areas.bowling.restart()

            // Cookie
            if(this.world.areas.cookie)
                this.world.areas.cookie.cookies.instancedGroup.needsUpdate = true

            // Toilet
            if(this.world.areas.toilet)
                this.world.areas.toilet.cabin.down = false

            // Social
            if(this.world.areas.social)
            {
                this.world.areas.social.statue.down = false
                this.world.areas.social.fans.instancedGroup.needsUpdate = true
            }
            
            // Benches
            if(this.world.benches)
                this.world.benches.instancedGroup.needsUpdate = true
            
            // Fences
            if(this.world.fences)
                this.world.fences.instancedGroup.needsUpdate = true
            
            // Bricks
            if(this.world.bricks)
                this.world.bricks.instancedGroup.needsUpdate = true
            
            // Lanterns
            if(this.world.lanterns)
                this.world.lanterns.instancedGroup.needsUpdate = true

            // Achievement
            gsap.delayedCall(2, () =>
            {
                this.achievements.setProgress('reset', 1)
            })
        })
    }
}

