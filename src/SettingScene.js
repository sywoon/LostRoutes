/**
 * Created by tonyguan on 2014/8/13.
 */
var SettingLayer = cc.Layer.extend({

    ctor: function () {
        //////////////////////////////
        // 1. super init first
        this._super();

        var bg = new cc.TMXTiledMap(res.red_bg_tmx);
        this.addChild(bg);

        var settingPage = new cc.Sprite("#setting.page.png");
        settingPage.x = winSize.width / 2;
        settingPage.y = winSize.height / 2;
        this.addChild(settingPage);

        //音效.
        var soundOnMenuItem = new cc.MenuItemImage(
        		"#check-on.png", "#check-on.png");
        var soundOffMenuItem = new cc.MenuItemImage(
        		"#check-off.png", "#check-off.png");
        var soundToggleMenuItem = new cc.MenuItemToggle(
        		soundOnMenuItem,
        		soundOffMenuItem,
            this.menuSoundToggleCallback, this);
        soundToggleMenuItem.x = winSize.width / 2 + 100;
        soundToggleMenuItem.y = winSize.height / 2  + 180;

        //音乐.
        var musicOnMenuItem  = new cc.MenuItemImage(
        		"#check-on.png", "#check-on.png");
        var musicOffMenuItem  = new cc.MenuItemImage(
        		"#check-off.png", "#check-off.png");
        var musicToggleMenuItem = new cc.MenuItemToggle(
        		musicOnMenuItem,
        		musicOffMenuItem,
        		this.menuMusicToggleCallback, this);        
        musicToggleMenuItem.x = soundToggleMenuItem.x;
        musicToggleMenuItem.y = soundToggleMenuItem.y - 110;

        //Ok菜单.
        var okNormal = new cc.Sprite("#button.ok.png");
        var okSelected = new cc.Sprite("#button.ok-on.png");
        var okMenuItem = new cc.MenuItemSprite(okNormal, okSelected, this.menuOkCallback, this);
        okMenuItem.x = 410;
        okMenuItem.y = 75;

        var mu = new cc.Menu(soundToggleMenuItem, musicToggleMenuItem, okMenuItem);
        mu.x = 0;
        mu.y = 0;
        this.addChild(mu);

        //设置音效和音乐选中状态
        if (musicStatus  == BOOL.YES) {
        	musicToggleMenuItem.setSelectedIndex(0);
        } else {
        	musicToggleMenuItem.setSelectedIndex(1);		
        }
        if (effectStatus  == BOOL.YES) {
        	soundToggleMenuItem.setSelectedIndex(0);
        } else {
        	soundToggleMenuItem.setSelectedIndex(1);
        }
        
        return true;
    },
    menuSoundToggleCallback: function (sender) {
        cc.log("menuSoundToggleCallback!");
        if (effectStatus == BOOL.YES) {
        	cc.sys.localStorage.setItem(EFFECT_KEY, BOOL.NO);
            effectStatus == BOOL.NO
        } else {
        	cc.sys.localStorage.setItem(EFFECT_KEY, BOOL.YES);
            effectStatus == BOOL.YES
        }        
    },
    menuMusicToggleCallback: function (sender) {
        cc.log("menuMusicToggleCallback!");
        if (musicStatus  ==  BOOL.YES) {
        	cc.sys.localStorage.setItem(MUSIC_KEY, BOOL.NO);
            musicStatus = BOOL.NO;
            cc.audioEngine.stopMusic();
        } else {
        	cc.sys.localStorage.setItem(MUSIC_KEY,  BOOL.YES);
            musicStatus = BOOL.YES;
        	cc.audioEngine.playMusic(res_platform.musicHome, true);	
        }         
    },
    menuOkCallback: function (sender) {
        cc.log("menuOkCallback!");
        cc.director.popScene();
        //播放音效
        if (effectStatus == BOOL.YES) {
        	cc.audioEngine.playEffect(res_platform.effectBlip);
        }
    },
    onEnterTransitionDidFinish: function () {
        this._super();
        cc.log("SettingLayer onEnterTransitionDidFinish");
        if (musicStatus == BOOL.YES) {
            cc.audioEngine.playMusic(res_platform.musicHome, true);
        }
    },
    onExit: function () {
        this._super();
        cc.log("SettingLayer onExit");
    },
    onExitTransitionDidStart: function () {
        this._super();
        cc.log("SettingLayer onExitTransitionDidStart");
        cc.audioEngine.stopMusic(res_platform.musicHome);
    }
});

var SettingScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new SettingLayer();
        this.addChild(layer);
    }
});

