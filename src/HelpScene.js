var HelpLayer = cc.Layer.extend({

    ctor: function () {
        //////////////////////////////
        // 1. super init first
        this._super();

        var bg = new cc.TMXTiledMap(res.red_bg_tmx);
        this.addChild(bg);

        var page = new cc.Sprite("#help.page.png");
        page.x = winSize.width / 2;
        page.y = winSize.height  / 2;
        this.addChild(page);
        //Ok菜单.
        var okNormal = new cc.Sprite("#button.ok.png");
        var okSelected = new cc.Sprite("#button.ok-on.png");
        var okMenuItem = new cc.MenuItemSprite(okNormal, okSelected,
                                            this.menuItemCallback, this);
        okMenuItem.x = 400;
        okMenuItem.y = 80;

        var mu = new cc.Menu(okMenuItem);
        mu.x = 0;
        mu.y = 0;
        this.addChild(mu);
        
        return true;
    },
    menuItemCallback: function (sender) {
    	cc.log("Touch Start Menu Item " + sender);
        cc.director.popScene();
        //播放音效
        if (effectStatus == BOOL.YES) {
        	cc.audioEngine.playEffect(res_platform.effectBlip);
        }
    },
    onEnterTransitionDidFinish: function () {
        this._super();
        cc.log("HelpLayer onEnterTransitionDidFinish");
        if (musicStatus == BOOL.YES) {
            cc.audioEngine.playMusic(res_platform.musicHome, true);
        }
    },
    onExit: function () {
        this._super();
        cc.log("HelpLayer onExit");
    },
    onExitTransitionDidStart: function () {
        this._super();
        cc.log("HelpLayer onExitTransitionDidStart");
        cc.audioEngine.stopMusic(res_platform.musicHome);
    }
});

var HelpScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new HelpLayer();
        this.addChild(layer);
    }
});

