
class Minimap extends Field {
	constructor(cfg) {
		let { parent, config } = cfg,
			opt = {
				...cfg,
				scale: 2,
				skew: 1,
				line: 1,
				color: "#fff",
				height: config.height,
				width: config.width,
				margin: {
					t: 15,
					l: 15,
					b: 0,
					r: 0 
				},
			};
		super(opt);

		let width = (this.width * 2) + 8;
		let height = (this.height * 2) + 8;
		let { cvs, ctx } = Utils.createCanvas(width, height);

		this.cvs = cvs;
		this.ctx = ctx;
		this.width = width;
		this.height= height;
		this._state = soccer.settings.minimap === "on";

		// semi-transparent box
		ctx.save();
		ctx.fillStyle = "#0003";
		ctx.beginPath();
		ctx.rect(0, 0, this.width, this.height);
		ctx.fill();
		ctx.restore();

		// render mini version of the field
		ctx.save();
		ctx.translate(4-this.oX, 4-this.oY);
		super.render(ctx);
		ctx.restore();
	}

	get isActive() {
		return this._state;
	}

	turn(state) {
		this._state = state != "off";
	}

	update(delta, time) {
		super.update(delta, time);
	}

	render(ctx) {
		if (!this._state) return;

		// draw base field once and render that here
		ctx.drawImage(this.cvs[0], this.oX, this.oY);

		ctx.save();
		ctx.translate(this.oX+4, this.oY+4);
		// ctx.globalCompositeOperation = "hard-light";
		// render player positions
		this.parent.players
			.filter(item => item.id?.startsWith("player-"))
			.map(player => {
				let r = 2.5,
					x = ((player.position.home.x / 22) * 2) - r,
					y = ((player.position.home.y / .85 / 22) * 2) - r,
					c = player.team.colors[0];
				ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, .75)`;
				ctx.beginPath();
				ctx.arc(x, y, r, 0, Math.TAU);
				ctx.fill();
			});
		// render ball
		let r = 3,
			{ x, y } = this.parent.ball.position.home;
		x = ((x / 22) * 2);
		y = ((y / .85 / 22) * 2);
		ctx.fillStyle = `#fff`;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.TAU);
		ctx.fill();

		ctx.restore();
	}
}
