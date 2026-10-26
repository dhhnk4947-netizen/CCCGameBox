System.register("chunks:///_virtual/Hall",["./HallView.ts"],(function(){return{setters:[null],execute:function(){}}}));

System.register("chunks:///_virtual/HallView.ts",["./rollupPluginModLoBabelHelpers.js","cc","./tea.decorators.ts","./UIView.ts"],(function(t){var n,e,i,o,r,l,a,u,s,c,p,f,b,g,h,B,d,m;return{setters:[function(t){n=t.applyDecoratedDescriptor,e=t.inheritsLoose,i=t.initializerDefineProperty,o=t.assertThisInitialized},function(t){r=t.cclegacy,l=t._decorator,a=t.Node,u=t.game,s=t.Tween,c=t.Quat,p=t.tween,f=t.easing,b=t.UITransform,g=t.Mask},function(t){h=t.Path},function(t){B=t.onMount,d=t.TBundleName,m=t.FullView}],execute:function(){var y,w,N,H,T,k,v,C,E,z,O,S,D,L,_,A,M,U,V,Q,F;r._RF.push({},"ba2e4Q3CJNKB6pf5gC5K2Kd","HallView",void 0);var I=l.ccclass;l.property,t("HallView",(y=I("HallView"),w=d("Hall"),N=h("titleBase/title"),H=h("btns/OpenListBtn"),T=h("btns/QuitBtn"),k=h("btns/HelpBtn"),v=h("btns/SettingBtn"),C=h("loading/Mask",b),E=h("loading/Mask",g),z=h("loading"),O=h("btns/HelpBtn"),y(S=w((L=n((D=function(t){function n(){for(var n,e=arguments.length,r=new Array(e),l=0;l<e;l++)r[l]=arguments[l];return n=t.call.apply(t,[this].concat(r))||this,i(n,"titleNode",L,o(n)),i(n,"openListBtn",_,o(n)),i(n,"quitBtn",A,o(n)),i(n,"helpBtn",M,o(n)),i(n,"settingBtn",U,o(n)),i(n,"animNode",V,o(n)),i(n,"animMask",Q,o(n)),i(n,"loading",F,o(n)),n}e(n,t);var r=n.prototype;return r.mount=function(){this.openListBtn.on(a.EventType.TOUCH_END,this.onClickOpenListBtn.bind(this)),this.quitBtn.on(a.EventType.TOUCH_END,this.onClickQuitBtn.bind(this)),this.helpBtn.on(a.EventType.TOUCH_END,this.onClickHelpBtn.bind(this)),this.settingBtn.on(a.EventType.TOUCH_END,this.onClickSettingBtn.bind(this))},r.onShow=function(){this.titleStartAnim()},r.onHide=function(){this.titleStopAnim()},r.onClickOpenListBtn=function(){startGame("T2048")},r.onClickQuitBtn=function(){u.end()},r.onClickSettingBtn=function(){},r.onClickHelpBtn=function(){},r.titleStartAnim=function(){s.stopAllByTarget(this.titleNode);var t=c.fromEuler(new c,40,6,0),n=c.fromEuler(new c,0,0,0),e=p(this.titleNode).to(1.5,{rotation:t},{easing:f.bounceOut}).to(2,{rotation:n},{easing:f.bounceIn}).delay(.5);p(this.titleNode).set({rotation:n}).repeatForever(e).start()},r.titleStopAnim=function(){s.stopAllByTarget(this.titleNode);var t=c.fromEuler(new c,0,0,0);p(this.titleNode).set({rotation:t}).start()},n}(m)).prototype,"titleNode",[N],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),_=n(D.prototype,"openListBtn",[H],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),A=n(D.prototype,"quitBtn",[T],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),M=n(D.prototype,"helpBtn",[k],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),U=n(D.prototype,"settingBtn",[v],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),V=n(D.prototype,"animNode",[C],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),Q=n(D.prototype,"animMask",[E],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),F=n(D.prototype,"loading",[z],{configurable:!0,enumerable:!0,writable:!0,initializer:function(){return null}}),n(D.prototype,"mount",[O,B],Object.getOwnPropertyDescriptor(D.prototype,"mount"),D.prototype),S=D))||S)||S));r._RF.pop()}}}));

(function(r) {
  r('virtual:///prerequisite-imports/Hall', 'chunks:///_virtual/Hall'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});