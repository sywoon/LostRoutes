
var Enemy = cc.PhysicsSprite.extend({//PhysicsSprite
	enemyType: 0,		//敌人类型
	initialHitPoints: 0,	//初始的生命值
	hitPoints: 0,		//当前的生命值
	velocity: null,			//速度
	space: null,         //所在物理空间
	ctor: function (enemyType, space) {
		//精灵帧
		var enemyFramName = EnemyName.Enemy_Stone;
		//得分值
		var hitPointsTemp = 0;
		//速度
		var velocityTemp = cc.p(0, 0);
		switch (enemyType) {
		case EnemyTypes.Enemy_Stone:
			enemyFramName = EnemyName.Enemy_Stone;
			hitPointsTemp = Enemy_initialHitPoints.Enemy_Stone;
			velocityTemp = Sprite_Velocity.Enemy_Stone;
			break;
		case EnemyTypes.Enemy_1:
			enemyFramName = EnemyName.Enemy_1;
			hitPointsTemp = Enemy_initialHitPoints.Enemy_1;
			velocityTemp = Sprite_Velocity.Enemy_1;
			break;
		case EnemyTypes.Enemy_2:
			enemyFramName = EnemyName.Enemy_2;
			hitPointsTemp = Enemy_initialHitPoints.Enemy_2;
			velocityTemp = Sprite_Velocity.Enemy_2;
			break;
		case EnemyTypes.Enemy_Planet:
			enemyFramName = EnemyName.Enemy_Planet;
			hitPointsTemp = Enemy_initialHitPoints.Enemy_Planet;
			velocityTemp = Sprite_Velocity.Enemy_Planet;
			break;
		}

		this._super("#" + enemyFramName);
		this.setVisible(false);

		this.initialHitPoints = hitPointsTemp;
		this.velocity = velocityTemp;
		this.enemyType = enemyType;

		this.space = space;

		var shape;

		if (enemyType == EnemyTypes.Enemy_Stone || enemyType == EnemyTypes.Enemy_Planet) {
			this.body = new cp.Body(10, cp.momentForCircle(1, 0, this.getContentSize().width / 2 - 5, cp.v(0, 0)));
			shape = new cp.CircleShape(this.body, this.getContentSize().width / 2 - 5, cp.v(0, 0));
		} else if (enemyType == EnemyTypes.Enemy_1) {
			var verts = [
			             -5, -91.5,
			             -59, -54.5,
			             -106, -0.5,
			             -68, 86.5,
			             56, 88.5,
			             110, -4.5
			             ];
			this.body = new cp.Body(1, cp.momentForPoly(1, verts, cp.vzero));
			shape = new cp.PolyShape(this.body, verts, cp.vzero);
		} else if (enemyType == EnemyTypes.Enemy_2) {
			var verts = [
			             2.5, 64.5,
			             73.5, -9.5,
			             5.5, -63.5,
			             -71.5, -6.5
			             ];
			this.body = new cp.Body(1, cp.momentForPoly(1, verts, cp.vzero));
			shape = new cp.PolyShape(this.body, verts, cp.vzero);
		}

		this.space.addBody(this.body);

		shape.setElasticity(0.5);
		shape.setFriction(0.5);
		shape.setCollisionType(Collision_Type.Enemy);
		this.space.addShape(shape);
		//this.setBody(this.body);
		this.body.data = this;

		this.scheduleUpdate();
	},

	update: function (dt) {
		//设置陨石和行星旋转.
		switch (this.enemyType) {
		case EnemyTypes.Enemy_Stone:
			this.setRotation(this.getRotation() - 0.5);
			break;
		case EnemyTypes.Enemy_Planet:
			this.setRotation(this.getRotation() + 1);
			break;
		}
		//计算移动位置
		var newX = this.body.getPos().x + this.velocity.x * dt;
		var newY = this.body.getPos().y + this.velocity.y * dt;

		this.body.setPos(cc.p(newX, newY));

		//超出屏幕重新生成敌人
		if (this.body.getPos().y + this.getContentSize().height / 2 < 0) {
			this.spawn();
		}
	},
	spawn: function () {
		var yPos = winSize.height + this.getContentSize().height / 2;
		var xPos = cc.random0To1() * (winSize.width - this.getContentSize().width) + this.getContentSize().width / 2;
		this.body.setPos(cc.p(xPos, yPos));
		this.hitPoints = this.initialHitPoints;
		this.setVisible(true);
	}
});
