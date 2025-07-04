
// soccer.stadium

{
	init() {
		// fast references
		this.els = {
			el: window.find(`div[data-area="stadium"]`),
			canvas: window.find(`div[data-area="stadium"] .canvas`),
		};
		// instantiate arena
		this.arena = new Arena({ canvas: this.els.canvas });
		// temp: bind event handlers
		this.els.el.on("mousedown wheel", this.doPanZoom);
	},
	async dispatch(event) {
		let APP = soccer,
			Self = APP.stadium,
			Input = Self.arena.stadium ? Self.arena.stadium.input : null,
			teams,
			value,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.keydown":
				switch (event.char) {
					case "w":
					case "up": Input.keys.up.pressed = true; break;
					case "s":
					case "down": Input.keys.down.pressed = true; break;
					case "a":
					case "left": Input.keys.left.pressed = true; break;
					case "d":
					case "right": Input.keys.right.pressed = true; break;
					case "space": Input.keys.shoot.pressed = true; break;
					case "p":
						if (Self.arena.fpsControl._stopped) Self.arena.fpsControl.start();
						else Self.arena.fpsControl.stop();
						break;
				}
				break;
			case "window.keyup":
				switch (event.char) {
					case "w":
					case "up": Input.keys.up.pressed = false; break;
					case "s":
					case "down": Input.keys.down.pressed = false; break;
					case "a":
					case "left": Input.keys.left.pressed = false; break;
					case "d":
					case "right": Input.keys.right.pressed = false; break;
					case "space":
						Input.keys.shoot.pressed = false;
						break;
				}
				break;
			// gamepad events
			case "gamepad.connected":
			case "gamepad.disconnected":
				// anything todo?
				break;
			case "gamepad.stick":
				let x = event.value[0],
					y = event.value[1];
				if (event.stick === "left") {
					Input.keys.left.pressed = x < 0;
					Input.keys.right.pressed = x > 0;
					Input.keys.up.pressed = y < 0;
					Input.keys.down.pressed = y > 0;
				} else {
					// set ship angle
					let angle = Math.atan2(x, -y),
						halfPI = Math.PI / 2,
						dir = (x === 1 && y === 0) ? 0 : angle - halfPI,
						firing = x !== 0 || y !== 0;

					Self.arena.player.fire.shooting = firing;
					Self.arena.player.dir = dir;
				}
				break;
			case "gamepad.down":
				switch (event.button) {
					case "b0": // x - shoot
						Input.keys.shoot.pressed = true;
						break;
				}
				break;
			case "gamepad.up":
				switch (event.button) {
					case "b0": // x - shoot
						Input.keys.shoot.pressed = false;
						break;
				}
				break;
			// custom events
			case "init-view":
				break;
			case "toggle-minimap":
				if (Self.arena.stadium) {
					value = Self.arena.stadium.minimap.isActive ? "off" : "on";
					if (event.value && Self.arena.stadium.minimap.isActive) return;
					Self.arena.stadium.minimap.turn(value);
				}
				break;
			case "add-teams":
				teams = APP.settings.teams;
				Object.keys(teams).map(key => {
					let xBeginHome = window.bluePrint.selectSingleNode(`//Formations/form[@id="begin-home"]`),
						xBeginAway = window.bluePrint.selectSingleNode(`//Formations/form[@id="begin-away"]`);
					// save reference to team node
					teams[key].xTeam = window.bluePrint.selectSingleNode(`//team[@name="${teams[key].name}"]`);
					// team colors
					teams[key].colors = JSON.parse(teams[key].xTeam.getAttribute("colors"));
					// team formation
					teams[key].players = window.bluePrint
						.selectNodes(`//Formations/form[@id = "${teams[key].xTeam.getAttribute("form")}"]/i`)
						.map(xPos => {
							let num = xPos.getAttribute("num"),
								xBegin1 = xBeginHome.selectSingleNode(`./i[@num="${num}"]`),
								xBegin2 = xBeginAway.selectSingleNode(`./i[@num="${num}"]`),
								xPlayer = teams[key].xTeam.selectSingleNode(`./i[@num = "${num}"]`),
								name = xPlayer.getAttribute("name"),
								position = {};

								if (key === "home") {
									position.y = +xBegin1.getAttribute("y");
									position.x = +xBegin1.getAttribute("x");
								} else {
									position.y = +xBegin2.getAttribute("y");
									position.x = +xBegin2.getAttribute("x");
								}

							return { name, num, position, xPlayer };
						});
				});
				Self.arena.setTeamColors(teams);
				Self.arena.setStadium();
				Self.arena.setTeam(teams);
				break;
			case "set-formation":
				// console.log(teams, event);
				Self.arena.stadium.team[event.team].players.map(player => {
					let xPath = `//Formations/form[@id = "${event.arg}"]/i[@num = "${player.num}"]`,
						xPos = window.bluePrint.selectSingleNode(xPath),
						x = +xPos.getAttribute("x"),
						y = +xPos.getAttribute("y");
					// set new position as target > "home"
					player.setTarget({ x, y });
					// console.log(event.team, player.name, { x, y });
				});
				break;
			case "set-debug-mode":
				Self.arena.setDebug(+event.arg);
				break;
		}
	},
	doPanZoom(event) {
		let APP = soccer,
			Self = APP.stadium,
			Drag = Self.drag;
		switch (event.type) {
			// zoom in/out
			case "wheel":
				let delta = event.deltaY === 0 ? event.deltaX : event.deltaY;
				Self.arena.viewport.zoom = Math.max(Math.min(Self.arena.viewport.zoom - (delta * .25), 100), 0);
				break;

			// pan stadium
			case "mousedown":
				// prevent default behaviour
				event.preventDefault();

				let doc = $(document),
					arena = Self.arena,
					offset = {
						y: arena.stadium.ball.position.home.y,
						x: arena.stadium.ball.position.home.x,
					},
					click = {
						y: event.clientY,
						x: event.clientX,
					};

				// drag info
				Self.drag = { doc, arena, click, offset };
				// bind event handlers
				Self.drag.doc.on("mousemove mouseup", Self.doPanZoom);
				break;
			case "mousemove":
				let y = Drag.offset.y - (event.clientY - Drag.click.y),
					x = Drag.offset.x - (event.clientX - Drag.click.x);
				Drag.arena.stadium.ball.body.position.y = y;
				Drag.arena.stadium.ball.body.position.x = x;
				break;
			case "mouseup":
				// unbind event handlers
				Self.drag.doc.off("mousemove mouseup", Self.doPanZoom);
				break;
		}
	}
}
