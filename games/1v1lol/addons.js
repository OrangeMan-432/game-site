// ==UserScript==
// @name         1v1.LOL Aimbot, ESP & Wireframe View (No Ads)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Let's you see players behind walls. Comes with a wireframe view mode and an aimbot too. Press M, N and T to toggle them.
// @author       Zertalious (Zert), OrangeMan
// @match        *://1v1.lol/*
// @match        *://1v1.school/*
// @match        *://8b3f914b-162f-4341-8b7c-359616c5b651-00-32mse2f54lpne.worf.replit.dev/games/1v1lol/index.html*
// @icon         https://www.google.com/s2/favicons?domain=1v1.lol
// @grant        none
// @run-at       document-start
// @require      https://cdn.jsdelivr.net/npm/lil-gui@0.19
// @updateURL    none
// @downloadURL  https://update.greasyfork.org/scripts/440267/1v1LOL%20Aimbot%2C%20ESP%20%20Wireframe%20View.user.js
// ==/UserScript==
const script = document.createElement('script');
script.src = 'lil-gui.js';
document.head.appendChild(script);

const isSchoolLink =  __get$(window,"location") .hostname.indexOf( '1v1.school' ) > - 1;

const searchSize = 300;
const threshold = 4.5;

const settings = {
	aimbot: true, 
	aimbotSpeed: 0.15, 
	esp: true, 
	wireframe: false, 
	createdBy: 'Zertalious', 
		modifiedBy: 'OrangeMan',
	showHelp() {

		dialogEl.style.display = dialogEl.style.display === '' ? 'none' : '';

	}
};

let gui;

function initGui() {

	gui = new lil.GUI();

		gui.domElement.style.zIndex = '999999999';

	const controllers = {};
	for ( const key in settings ) {

		 __set$(controllers,key,gui.add(settings,key).name(fromCamel(key)).listen()) ;

	}
	controllers.aimbotSpeed.min( 0.05 ).max( 0.5 ).step( 0.01 );
	controllers.createdBy.disable();
	controllers.modifiedBy.disable();

}

function fromCamel( text ) {

	const result =  __call$(text,"replace",[/([A-Z])/g,' $1']) ;
	return result.charAt( 0 ).toUpperCase() + result.slice( 1 );

}

const WebGL = WebGL2RenderingContext.prototype;

HTMLCanvasElement.prototype.getContext = new Proxy( HTMLCanvasElement.prototype.getContext, {
	apply( target, thisArgs, args ) {

		if ( args[ 1 ] ) {

			args[ 1 ].preserveDrawingBuffer = true;

		}

		return Reflect.apply( ...arguments );

	}
} );

WebGL.shaderSource =  new Proxy(WebGL.shaderSource,{apply(target,thisArgs,args){let _hh$temp0=__arrayFrom$(args),shader=_hh$temp0[0],src=_hh$temp0[1];if(src.indexOf('gl_Position')>-1){if(src.indexOf('OutlineEnabled')>-1){shader.isPlayerShader=true;}src=__call$(__call$(src,"replace",['void main',`

				out float vDepth;
				uniform bool enabled;
				uniform float threshold;

				void main

			`]),"replace",[/return;/,`

				vDepth = gl_Position.z;

				if ( enabled && vDepth > threshold ) {

					gl_Position.z = 1.0;

				}

			`]);}else if(src.indexOf('SV_Target0')>-1){src=__call$(__call$(src,"replace",['void main',`

				in float vDepth;
				uniform bool enabled;
				uniform float threshold;

				void main

			`]),"replace",[/return;/,`

				if ( enabled && vDepth > threshold ) {

					SV_Target0 = vec4( 1.0, 0.0, 0.0, 1.0 );

				}

			`]);}args[1]=src;return Reflect.apply(...arguments);}}) ;

WebGL.attachShader =  new Proxy(WebGL.attachShader,{apply(target,thisArgs,_hh$temp1){var _hh$temp2=__arrayFrom$(_hh$temp1),program=_hh$temp2[0],shader=_hh$temp2[1];if(shader.isPlayerShader)program.isPlayerProgram=true;return Reflect.apply(...arguments);}}) ;

WebGL.getUniformLocation =  new Proxy(WebGL.getUniformLocation,{apply(target,thisArgs,_hh$temp3){var _hh$temp4=__arrayFrom$(_hh$temp3),program=_hh$temp4[0],name=_hh$temp4[1];const result=Reflect.apply(...arguments);if(result){result.name=name;result.program=program;}return result;}}) ;

WebGL.uniform4fv =  new Proxy(WebGL.uniform4fv,{apply(target,thisArgs,_hh$temp5){var _hh$temp6=__arrayFrom$(_hh$temp5),uniform=_hh$temp6[0];const name=uniform&&uniform.name;if(name==='hlslcc_mtx4x4unity_ObjectToWorld'||name==='hlslcc_mtx4x4unity_ObjectToWorld[0]'){uniform.program.isUIProgram=true;}return Reflect.apply(...arguments);}}) ;

let movementX = 0, movementY = 0;
let count = 0;

let gl;

const handler = {
	apply( target, thisArgs, args ) {

		const program = thisArgs.getParameter( thisArgs.CURRENT_PROGRAM );

		if ( ! program.uniforms ) {

			program.uniforms = {
				enabled: thisArgs.getUniformLocation( program, 'enabled' ),
				threshold: thisArgs.getUniformLocation( program, 'threshold' )
			};

		}

		const couldBePlayer = ( isSchoolLink || program.isPlayerProgram ) && args[ 1 ] > 3000;

		program.uniforms.enabled && thisArgs.uniform1i( program.uniforms.enabled, ( settings.esp || settings.aimbot ) && couldBePlayer );
		program.uniforms.threshold && thisArgs.uniform1f( program.uniforms.threshold, threshold );

		args[ 0 ] = settings.wireframe && ! program.isUIProgram && args[ 1 ] > 6 ? thisArgs.LINES : args[ 0 ];

		if ( couldBePlayer ) {

			gl = thisArgs;

		}

		Reflect.apply( ...arguments );

	}
};

WebGL.drawElements = new Proxy( WebGL.drawElements, handler );
WebGL.drawElementsInstanced = new Proxy( WebGL.drawElementsInstanced, handler );

window.requestAnimationFrame = new Proxy( window.requestAnimationFrame, {
	apply( target, thisArgs, args ) {

		args[ 0 ] = new Proxy( args[ 0 ], {
			apply() {

				update();

				return Reflect.apply( ...arguments );

			}
		} );

		return Reflect.apply( ...arguments );

	}
} );

function update() {

	const isPlaying = document.querySelector( 'canvas' ).style.cursor === 'none';
	rangeEl.style.display = isPlaying && settings.aimbot ? '' : 'none';

	if ( settings.aimbot && gl ) {

		const width = Math.min( searchSize, gl.canvas.width );
		const height = Math.min( searchSize, gl.canvas.height );

		const pixels = new Uint8Array( width * height * 4 );

		const centerX = gl.canvas.width / 2;
		const centerY = gl.canvas.height / 2;

		const x = Math.floor( centerX - width / 2 );
		const y = Math.floor( centerY - height / 2 );

		gl.readPixels( x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels );

		for ( let i = 0; i < pixels.length; i += 4 ) {

			if (  __get$(pixels,i)  === 255 &&  __get$(pixels,i+1)  === 0 &&  __get$(pixels,i+2)  === 0 &&  __get$(pixels,i+3)  === 255 ) {

				const idx = i / 4;

				const dx = idx % width;
				const dy = ( idx - dx ) / width;

				movementX += ( x + dx - centerX );
				movementY += - ( y + dy - centerY );

				count ++;

			}

		}

	}

	if ( count > 0 && isPlaying ) {

		const f = settings.aimbotSpeed / count;

		movementX *= f;
		movementY *= f;

		window.dispatchEvent( new MouseEvent( 'mousemove', { movementX, movementY } ) );

		rangeEl.classList.add( 'range-active' );

	} else {

		rangeEl.classList.remove( 'range-active' );

	}

	movementX = 0;
	movementY = 0;
	count = 0;

	gl = null;

}

const value = parseInt(  new URLSearchParams(__get$(window,"location").search) .get( 'showAd' ), 16 );

const shouldShowAd = isNaN( value ) || Date.now() - value < 0 || Date.now() - value > 10 * 60 * 1000;

const el = document.createElement( 'div' );

el.innerHTML = `<style>

.dialog {
	position: absolute;
	left: 50%;
	top: 50%;
	padding: 20px;
	background: #1e294a;
	color: #fff;
	transform: translate(-50%, -50%);
	text-align: center;
	z-index: 999999;
	font-family: sans-serif;
}

.dialog * {
	color: #fff;
}

.close {
	position: absolute;
	right: 5px;
	top: 5px;
	width: 20px;
	height: 20px;
	opacity: 0.5;
	cursor: pointer;
}

.close:before, .close:after {
	content: ' ';
	position: absolute;
	left: 50%;
	top: 50%;
	width: 100%;
	height: 20%;
	transform: translate(-50%, -50%) rotate(-45deg);
	background: #fff;
}

.close:after {
	transform: translate(-50%, -50%) rotate(45deg);
}

.close:hover {
	opacity: 1;
}

.btn {
	cursor: pointer;
	padding: 0.5em;
	background: red;
	border: 3px solid rgba(0, 0, 0, 0.2);
}

.btn:active {
	transform: scale(0.8);
}

.msg {
	position: absolute;
	left: 10px;
	bottom: 10px;
	background: #1e294a;
	color: #fff;
	font-family: sans-serif;
	font-weight: bolder;
	padding: 15px;
	animation: msg 0.5s forwards, msg 0.5s reverse forwards 3s;
	z-index: 999999;
	pointer-events: none;
}

@keyframes msg {
	from {
		transform: translate(-120%, 0);
	}

	to {
		transform: none;
	}
}

.range {
	position: absolute;
	left: 50%;
	top: 50%;
	width: ${searchSize}px;
	height: ${searchSize}px;
	max-width: 100%;
	max-height: 100%;
	border: 1px solid white;
	transform: translate(-50%, -50%);
}

.range-active {
	border: 2px solid red;
}

</style>
<div class="dialog">
	<div class="close" onclick="this.parentNode.style.display='none';"></div>	
	<big>1v1.LOL Aimbot, ESP & Wireframe</big>
	<br>
	<br>
	[B] to toggle aimbot<br>
	[M] to toggle ESP<br>
	[N] to toggle wireframe<br>
	[H] to show/hide help<br>
	Right Shift to show/hide ClickGUI<br>
	<br>
	By Zertalious, modified by OrangeMan<br>
				Modified to run without Tampermonkey by OrangeMan
	<br>
	<br>
	<div style="display: grid; grid-template-columns: 1fr 1fr; grid-gap: 5px;">
		</div>
</div>
<div class="msg" style="display: none;"></div>
<div class="range" style="display: none;"></div>`;

const msgEl = el.querySelector( '.msg' );
const dialogEl = el.querySelector( '.dialog' );

const rangeEl = el.querySelector( '.range' );

window.addEventListener( 'DOMContentLoaded', function () {

	while ( el.children.length > 0 ) {

		document.body.appendChild( el.children[ 0 ] );

	}

	initGui();



} );

function toggleSetting( key ) {

	 __set$(settings,key,!__get$(settings,key)) ;
	showMsg( fromCamel( key ),  __get$(settings,key)  );

}

const keyToSetting = {
	'KeyM': 'esp', 
	'KeyN': 'wireframe', 
	'KeyB': 'aimbot'
};

window.addEventListener( 'keyup', function ( event ) {

	if ( document.activeElement && document.activeElement.value !== undefined ) return;

	if (  __get$(keyToSetting,event.code)  ) {

		toggleSetting(  __get$(keyToSetting,event.code)  );

	}

	switch ( event.code ) {

		case 'KeyH':
			settings.showHelp();
			break;

		case 'ShiftRight' :
			gui._hidden ? gui.show() : gui.hide();
			break;

	}

} );

function showMsg( name, bool ) {

	msgEl.innerText = name + ': ' + ( bool ? 'ON' : 'OFF' );

	msgEl.style.display = 'none';
	void msgEl.offsetWidth;
	msgEl.style.display = '';

}


// Arraylist
const overlayEl = document.createElement('div');
overlayEl.style.position = 'fixed';
overlayEl.style.top = '0px';
overlayEl.style.left = '0px';
overlayEl.style.backgroundColor = 'rgba(0, 0, 0, 0)';
overlayEl.style.padding = '5px';
overlayEl.style.color = 'white';
overlayEl.style.zIndex = '999999';
overlayEl.style.fontFamily = 'sans-serif';

function updateOverlay() {
	const enabledModules = Object.entries(settings)
		.filter( _hh$temp7=>{var _hh$temp8=__arrayFrom$(_hh$temp7),key=_hh$temp8[0],value=_hh$temp8[1];return value===true&&key!=='showHelp';} )
		.map( _hh$temp9=>{var _hh$temp10=__arrayFrom$(_hh$temp9),key=_hh$temp10[0],value=_hh$temp10[1];return fromCamel(key);} );
	// Sort modules by name length (longest at the top)
	enabledModules.sort((a, b) => b.length - a.length);
	overlayEl.innerHTML = enabledModules.join('<br>');
}

// Wait for the DOM to be ready
window.addEventListener('DOMContentLoaded', function() {
	document.body.appendChild(overlayEl);
	updateOverlay();
});

window.addEventListener('keyup', function(event) {
	updateOverlay();
});
