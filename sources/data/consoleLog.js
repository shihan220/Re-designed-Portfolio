import * as THREE from 'three/webgpu'

const text = `
██████╗ ██████╗ ██╗   ██╗███╗   ██╗ ██████╗ ██╗███████╗                   
██╔══██╗██╔══██╗██║   ██║████╗  ██║██╔═══██╗╚═╝██╔════╝                   
██████╔╝██████╔╝██║   ██║██╔██╗ ██║██║   ██║   ███████╗                   
██╔══██╗██╔══██╗██║   ██║██║╚██╗██║██║   ██║   ╚════██║                   
██████╔╝██║  ██║╚██████╔╝██║ ╚████║╚██████╔╝   ███████║                   
╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝    ╚══════╝                   
                                                                       
██████╗  ██████╗ ██████╗ ████████╗███████╗ ██████╗ ██╗     ██╗ ██████╗ 
██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██║     ██║██╔═══██╗
██████╔╝██║   ██║██████╔╝   ██║   █████╗  ██║   ██║██║     ██║██║   ██║
██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══╝  ██║   ██║██║     ██║██║   ██║
██║     ╚██████╔╝██║  ██║   ██║   ██║     ╚██████╔╝███████╗██║╚██████╔╝
╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ 

╔═ Intro ═══════════════╗
║ Thank you for visiting my portfolio, you sneaky developer!
║ If you are curious about the stack and how I built this project, here’s everything you need to know.
╚═══════════════════════╝

╔═ Socials ═══════════════╗
║ Mail           ⇒ mohammad.shihan@outlook.com
║ Discord        ⇒ shihan_up2299021
║ Twitch         ⇒ https://www.twitch.tv/bruno_simon_dev
║ GitHub         ⇒ https://github.com/shihan220
║ LinkedIn       ⇒ https://www.linkedin.com/in/mohammad-shihan/
╚═══════════════════════╝

╔═ Debug ═══════════════╗
║ You can access the debug mode by adding #debug at the end of the URL and reloading.
║ Press [V] to toggle the free camera.
╚═══════════════════════╝

╔═ Three.js ════════════╗
║ Three.js is the library I’m using to render this 3D world (release: ${THREE.REVISION})
║ https://threejs.org/
║ It was created by mr.doob (https://x.com/mrdoob, https://github.com/mrdoob),
║ followed by hundreds of awesome developers,
║ one of which being Sunag (https://x.com/sea3dformat, https://github.com/sunag) who added TSL,
║ enabling the use of both WebGL and WebGPU, making this portfolio possible.
╚═══════════════════════╝

╔═ Three.js Journey ════╗
║ If you want to learn Three.js, I got you covered with this huge course.
║ https://threejs-journey.com/
║ It contains everything you need to start building awesome stuff with Three.js (and much more).
╚═══════════════════════╝

╔═ Devlogs ═════════════╗
║ I have been documenting the build process of this portfolio as it evolves.
╚═══════════════════════╝

╔═ Source code ═════════╗
║ The code is available on GitHub under MIT license. Even the Blender files are there, so have fun!
║ https://github.com/shihan220/Re-designed-Portfolio
║ For security reasons, I’m not sharing the server code, but the portfolio works without it.
╚═══════════════════════╝

╔═ Musics ══════════════╗
║ The music you hear was made especially for this portfolio by the awesome Kounine (Linktree).
║ https://linktr.ee/Kounine
║ They are now under CC0 license, meaning you can do whatever you want with them!
║ Download them here.
║ https://github.com/brunosimon/folio-2025/tree/main/static/sounds/musics
╚═══════════════════════╝

╔═ Some more links ═════╗
║ Rapier (Physics library)  ⇒ https://rapier.rs/
║ Howler.js (Audio library) ⇒ https://howlerjs.com/
║ Amatic SC (Fonts)         ⇒ https://fonts.google.com/specimen/Amatic+SC
║ Nunito (Fonts).           ⇒ https://fonts.google.com/specimen/Nunito?query=Nunito
╚═══════════════════════╝
`
let finalText = ''
let finalStyles = []
const stylesSet = {
    letter: 'color: #ffffff; font: 400 1em monospace;',
    pipe: 'color: #D66FFF; font: 400 1em monospace;',
}
let currentStyle = null
for(let i = 0; i < text.length; i++)
{
    const char = text[i]

    const style = char.match(/[╔║═╗╚╝╔╝]/) ? 'pipe' : 'letter'
    if(style !== currentStyle)
    {
        currentStyle = style
        finalText += '%c'

        finalStyles.push(stylesSet[currentStyle])
    }
    finalText += char
}

export default [finalText, ...finalStyles]
