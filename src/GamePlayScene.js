var GamePlayLayer = cc.Layer.extend({
    score: 0,                        //分数
    scorePlaceholder: 0,    //记录0~999分数
    fighter: null,
    touchFighterlistener: null,
    menu: null,
    space: null,
    ctor: function () {

        cc.log("GamePlayLayer ctor");
        //////////////////////////////
        // 1. super init first
        this._super();
        this.initPhysics();
        this.initBG();
        this.scheduleUpdate();
        return true;
    },
    // 物理空间初始化
    initPhysics: function () {

        //////////////////////////////////////物理空间初始化 开始 ////////////////////////////////////////
        this.space = new cp.Space();
        //this.setupDebugNode();
        // 设置重力
        this.space.gravity = cp.v(0, 0);//cp.v(0, -100);
        this.space.addCollisionHandler(Collision_Type.Bullet, Collision_Type.Enemy,
            this.collisionBegin.bind(this), null, null, null
        );
        /////////////////////////////////////物理空间初始化  结束 /////////////////////////////////////////

    },
    //初始化游戏背景.
    initBG: function () {

        //添加背景地图.
        var bg = new cc.TMXTiledMap(res.blue_bg_tmx);
        this.addChild(bg, 0, GameSceneNodeTag.BatchBackground);

        //放置发光粒子背景
        var ps = new cc.ParticleSystem(res.light_plist);
        ps.x = winSize.width / 2;
        ps.y = winSize.height / 2;
        this.addChild(ps, 0, GameSceneNodeTag.BatchBackground);

        //添加背景精灵1.
        var sprite1 = new cc.Sprite("#gameplay.bg.sprite-1.png");
        sprite1.setPosition(cc.p(-50, -50));
        this.addChild(sprite1, 0, GameSceneNodeTag.BatchBackground);

        var ac1 = cc.moveBy(20, cc.p(500, 600));
        var ac2 = ac1.reverse();
        var as1 = cc.sequence(ac1, ac2);
        sprite1.runAction(cc.repeatForever(new cc.EaseSineInOut(as1)));

        //添加背景精灵2.
        var sprite2 = new cc.Sprite("#gameplay.bg.sprite-2.png");
        sprite2.setPosition(cc.p(winSize.width, 0));
        this.addChild(sprite2, 0, GameSceneNodeTag.BatchBackground);

        var ac3 = cc.moveBy(10, cc.p(-500, 600));
        var ac4 = ac3.reverse();
        var as2 = cc.sequence(ac3, ac4);
        sprite2.runAction(cc.repeatForever(new cc.EaseExponentialInOut(as2)));

        //初始化暂停按钮.
        var pauseMenuItem = new cc.MenuItemImage(
            "#button.pause.png", "#button.pause.png",
            this.menuPauseCallback, this);

        var pauseMenu = new cc.Menu(pauseMenuItem);
        pauseMenu.setPosition(cc.p(30, winSize.height - 28));
        this.addChild(pauseMenu, 200, 999);

        //添加陨石1.
        var stone1 = new Enemy(EnemyTypes.Enemy_Stone, this.space);
        this.addChild(stone1, 10, GameSceneNodeTag.BatchBackground);

        //添加行星.
        var planet = new Enemy(EnemyTypes.Enemy_Planet, this.space);
        this.addChild(planet, 10, GameSceneNodeTag.Enemy);

        //添加敌机1.
        var enemyFighter1 = new Enemy(EnemyTypes.Enemy_1, this.space);
        this.addChild(enemyFighter1, 10, GameSceneNodeTag.Enemy);

        //添加敌机2.
        var enemyFighter2 = new Enemy(EnemyTypes.Enemy_2, this.space);
        this.addChild(enemyFighter2, 10, GameSceneNodeTag.Enemy);

        //玩家的飞机.
        this.fighter = new Fighter("#gameplay.fighter.png", this.space);
        this.fighter.body.setPos(cc.p(winSize.width / 2, 70));
        this.addChild(this.fighter, 10, GameSceneNodeTag.Fighter);

        //创建 触摸飞机事件监听器
        this.touchFighterlistener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true, // 设置是否吞没事件
            onTouchBegan: function (touch, event) {
                return true;
            },
            onTouchMoved: function (touch, event) {
                //  cc.log("onTouchMoved");
                var target = event.getCurrentTarget();
                var delta = touch.getDelta();
                // 移动当前按钮精灵的坐标位置
                var pos_x = target.body.getPos().x + delta.x;
                var pos_y = target.body.getPos().y + delta.y;
                target.body.setPos(cc.p(pos_x, pos_y));
            }
        });
        // 注册 触摸飞机事件监听器
        cc.eventManager.addListener(this.touchFighterlistener, this.fighter);
        this.touchFighterlistener.retain();

        //每0.2s 调用shootBullet函数发射1发炮弹.
        this.schedule(this.shootBullet, 0.2);

        //在状态栏中设置玩家的生命值
        this.updateStatusBarFighter();
        //在状态栏中显示得分
        this.updateStatusBarScore();
    },
    ///////////////////////////物理引擎碰撞检测  开始////////////////////////////////////
    collisionBegin: function (arbiter, space) {

        var shapes = arbiter.getShapes();

        var bodyA = shapes[0].getBody();
        var bodyB = shapes[1].getBody();

        var spriteA = bodyA.data;
        var spriteB = bodyB.data;

        //检查到炮弹击中敌机
        if (spriteA instanceof  Bullet && spriteB  instanceof  Enemy && spriteB.isVisible()) {
            //使得炮弹消失
            spriteA.setVisible(false);
            //cc.pool.putInPool(spriteA);
            this.handleBulletCollidingWithEnemy(spriteB);
            return false;
        }
        if (spriteA instanceof  Enemy && spriteA.isVisible() && spriteB  instanceof  Bullet) {
            //使得炮弹消失
            spriteB.setVisible(false);
            //cc.pool.putInPool(spriteB);
            this.handleBulletCollidingWithEnemy(spriteA);
            return false;
        }

        //检查到敌机与我方飞机碰撞
        if (spriteA instanceof  Fighter && spriteB  instanceof  Enemy && spriteB.isVisible()) {
            this.handleFighterCollidingWithEnemy(spriteB);
            return false;
        }
        if (spriteA instanceof  Enemy && spriteA.isVisible() && spriteB  instanceof  Fighter) {
            this.handleFighterCollidingWithEnemy(spriteA);
        }

        return false;
    },
    update: function (dt) {
        var timeStep = 0.03;
        this.space.step(timeStep);
    },
    //炮弹与敌人的碰撞检测
    handleBulletCollidingWithEnemy: function (enemy) {
        enemy.hitPoints--;
        if (enemy.hitPoints == 0) {
            var node = this.getChildByTag(GameSceneNodeTag.ExplosionParticleSystem);
            if (node) {
                this.removeChild(node);
            }
            //爆炸粒子效果
            var explosion = new cc.ParticleSystem(res.explosion_plist);
            explosion.x = enemy.x;
            explosion.y = enemy.y;
            this.addChild(explosion, 2, GameSceneNodeTag.ExplosionParticleSystem);
            //爆炸音效
            if (effectStatus == BOOL.YES) {
                cc.audioEngine.playEffect(res_platform.effectExplosion);
            }

            switch (enemy.enemyType) {
                case EnemyTypes.Enemy_Stone:
                    this.score += EnemyScores.Enemy_Stone;
                    this.scorePlaceholder += EnemyScores.Enemy_Stone;
                    break;
                case EnemyTypes.Enemy_1:
                    this.score += EnemyScores.Enemy_1;
                    this.scorePlaceholder += EnemyScores.Enemy_1;
                    break;
                case EnemyTypes.Enemy_2:
                    this.score += EnemyScores.Enemy_2;
                    this.scorePlaceholder += EnemyScores.Enemy_2;
                    break;
                case EnemyTypes.Enemy_Planet:
                    this.score += EnemyScores.Enemy_Planet;
                    this.scorePlaceholder += EnemyScores.Enemy_Planet;
                    break;
            }
            //每次获得1000分数，生命值 加一，scorePlaceholder恢复0.
            if (this.scorePlaceholder >= 1000) {
                this.fighter.hitPoints++;
                this.updateStatusBarFighter();
                this.scorePlaceholder -= 1000;
            }

            this.updateStatusBarScore();
            //设置敌人消失
            enemy.setVisible(false);
            enemy.spawn();
        }
    },
    //处理玩家与敌人的碰撞检测
    handleFighterCollidingWithEnemy: function (enemy) {

        var node = this.getChildByTag(GameSceneNodeTag.ExplosionParticleSystem);
        if (node) {
            this.removeChild(node);
        }
        //爆炸粒子效果
        var explosion = new cc.ParticleSystem(res.explosion_plist);
        explosion.x = this.fighter.x;
        explosion.y = this.fighter.y;
        this.addChild(explosion, 2, GameSceneNodeTag.ExplosionParticleSystem);
        //爆炸音效
        if (effectStatus == BOOL.YES) {
            cc.audioEngine.playEffect(res_platform.effectExplosion);
        }
        //设置敌人消失
        enemy.setVisible(false);
        enemy.spawn();

        //设置玩家消失
        this.fighter.hitPoints--;
        this.updateStatusBarFighter();
        //游戏结束
        if (this.fighter.hitPoints <= 0) {
            cc.log("GameOver");
            var scene = new GameOverScene();
            var layer = new GameOverLayer(this.score);
            scene.addChild(layer);
            cc.director.pushScene(new cc.TransitionFade(1, scene));
        } else {
            this.fighter.body.setPos(cc.p(winSize.width / 2, 70));
            var ac1 = cc.show();
            var ac2 = cc.fadeIn(3.0);
            var seq = cc.sequence(ac1, ac2);
            this.fighter.runAction(seq);
        }
    },
    ///////////////////////////物理引擎碰撞检测  结束////////////////////////////////////

    menuPauseCallback: function (sender) {

        //播放音效
        if (effectStatus == BOOL.YES) {
            cc.audioEngine.playEffect(res_platform.effectBlip);
        }

        var nodes = this.getChildren();
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            node.unscheduleUpdate();
            this.unschedule(this.shootBullet);
        }

        //暂停触摸事件
        cc.eventManager.pauseTarget(this.fighter);

        //返回主菜单
        var backNormal = new cc.Sprite("#button.back.png");
        var backSelected = new cc.Sprite("#button.back-on.png");

        var backMenuItem = new cc.MenuItemSprite(backNormal, backSelected,
            function (sender) {
                //播放音效
                if (effectStatus == BOOL.YES) {
                    cc.audioEngine.playEffect(res_platform.effectBlip);
                }
                cc.director.popScene();

            }, this);

        //继续游戏菜单
        var resumeNormal = new cc.Sprite("#button.resume.png");
        var resumeSelected = new cc.Sprite("#button.resume-on.png");

        var resumeMenuItem = new cc.MenuItemSprite(resumeNormal, resumeSelected,
            function (sender) {

                //播放音效
                if (effectStatus == BOOL.YES) {
                    cc.audioEngine.playEffect(res_platform.effectBlip);
                }
                var nodes = this.getChildren();
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    node.scheduleUpdate();
                    this.schedule(this.shootBullet, 0.2);
                }
                //继续触摸事件
                cc.eventManager.resumeTarget(this.fighter);
                this.removeChild(this.menu);

            }, this);

        this.menu = new cc.Menu(backMenuItem, resumeMenuItem);
        this.menu.alignItemsVertically();
        this.menu.x = winSize.width / 2;
        this.menu.y = winSize.height / 2;

        this.addChild(this.menu, 20, 1000);
    },

    //飞机发射炮弹
    shootBullet: function (dt) {
        if (this.fighter && this.fighter.isVisible()) {
            // var bullet = new Bullet("#gameplay.bullet.png", this.space);
            var bullet = Bullet.create("#gameplay.bullet.png", this.space);
            bullet.velocity = Sprite_Velocity.Bullet;
            if (bullet.getParent() == null) {
                this.addChild(bullet, 0, GameSceneNodeTag.Bullet);
                cc.pool.putInPool(bullet);
            }
            bullet.shootBulletFromFighter(cc.p(this.fighter.x, this.fighter.y + this.fighter.getContentSize().height / 2));
        }
    },
    //在状态栏中显示得分
    updateStatusBarScore: function () {
        cc.log(" this.score =   " + this.score);
        var n = this.getChildByTag(GameSceneNodeTag.StatusBarScore);
        if (n) {
            this.removeChild(n);
        }

        var scoreLabel = new cc.LabelBMFont(this.score, res.BMFont_fnt);
        scoreLabel.setScale(0.8);
        scoreLabel.x = winSize.width / 2;
        scoreLabel.y = winSize.height - 28;

        this.addChild(scoreLabel, 20, GameSceneNodeTag.StatusBarScore);
    },
    //在状态栏中设置玩家的生命值
    updateStatusBarFighter: function () {
        //先移除上次的精灵
        var n = this.getChildByTag(GameSceneNodeTag.StatusBarFighterNode);
        if (n) {
            this.removeChild(n);
        }
        var fg = new cc.Sprite("#gameplay.life.png");
        fg.x = winSize.width - 80;
        fg.y = winSize.height - 28;

        this.addChild(fg, 20, GameSceneNodeTag.StatusBarFighterNode);

        //添加生命值 x 5
        var n2 = this.getChildByTag(GameSceneNodeTag.StatusBarLifeNode);
        if (n2) {
            this.removeChild(n2);
        }
        if (this.fighter.hitPoints < 0)
            this.fighter.hitPoints = 0;

        var lifeLabel = new cc.LabelBMFont("X" + this.fighter.hitPoints, res.BMFont_fnt);
        lifeLabel.setScale(0.5);
        lifeLabel.x = fg.x + 40;
        lifeLabel.y = fg.y;

        this.addChild(lifeLabel, 20, GameSceneNodeTag.StatusBarLifeNode);
    },
    onEnterTransitionDidFinish: function () {
        this._super();
        cc.log("GamePlayLayer onEnterTransitionDidFinish");
        if (musicStatus == BOOL.YES) {
            //播放背景音乐
            cc.audioEngine.playMusic(res_platform.musicGame, true);
        }
    },
    onEnter: function () {
        this._super();
        cc.log("GamePlayLayer onEnter");
    },
    onExit: function () {

        cc.log("GamePlayLayer onExit");
        this.unscheduleUpdate();
        //停止调用 shootBullet函数.
        this.unschedule(this.shootBullet);
        //注销事件监听器.
        if (this.touchFighterlistener != null) {
            cc.eventManager.removeListener(this.touchFighterlistener);
            this.touchFighterlistener.release();
            this.touchFighterlistener = null;
        }
        this.removeAllChildren(true);
        cc.pool.drainAllPools();
        this._super();
    },
    onExitTransitionDidStart: function () {
        this._super();
        cc.log("GamePlayLayer onExitTransitionDidStart");
        cc.audioEngine.stopMusic(res_platform.musicGame);
    }
});

var GamePlayScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new GamePlayLayer();
        this.addChild(layer);
    }
});

