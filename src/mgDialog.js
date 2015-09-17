/*!
* mgDialog 基于jQuery的对话框组件
* author: Mango
* version: 0.1
*
* 实现功能:
* 结构可配置:标题，按钮，关闭X，遮罩(模态)
* 可完全自定义dom结构
* 两种定位方式:absolute(默认)、fixed
* 事件可配置:按钮，按键，计时
* 自定义事件
* 按键监听
* 倒计时
* 出入场动画
* 多窗口
* 拖拽
* 内置方法 alert confirm prompt toast
*
* 计划:
* title(str|jqObj,position) [√]
* content(str|jqObj,position) [√]
* width(num,position) [√]
* height(num,position) [√]
* button(str|jqObj) [√]
* countdown(num) [√]
* position() [√]
* autoFocus [√]
* 链式调用 [√]
* 表单元素无法输入 [√]
* 输入时按回车键不符合预期 [√]
* 自定义margin 必须为0 [√]
* 按钮底部定位 [√]
* drag对话框选中文字 [√]
* 遮罩特效使对话框z-index失效，故去掉 [√]
* destroy()之后，自定义dom对话框完全还原 [√]
* 关闭mask后 窗口scroll值还原 [√]
* button:添加hidden属性，去掉id属性，把button添加到dom.button，删除getButton() [√]
* 自定义dom和自带dom的外层class分开，防止样式干扰 [√]
* window.onresize [√]
* reset() [√]
* width,height 支持auto [√]
*
* 期望:
* focus()
* blur()
* quickClose()
* 动画可配置
*
* 二次封装，综合应用：
* 视频滚屏弹出效果
* 中奖弹出效果
* 图片预览效果
* 大尺寸图片效果
*
* */
(function(window,$,document,undefined){

	//全局默认值
	var _baseZ		= 1000,			//z-index基准 遮罩的z-index 为_baseZ，对话框的依次累加
		_dargMark	= 'dragbar',	//可拖拽元素标记
		_cdReg		= /\{\%cd\}/gi, //倒数元素标记正则
		_stCD		= '<span data-role="cd"></span>';	//倒计时元素模板

	//对话框配置项
	var _config = {
		hasMask			: true,		//是否启用背景遮罩 [*]
		hasTitle		: true,		//是否有标题
		hasCross		: true,		//是否有关闭按钮X
		hotKeys			: true,		//是否启用键盘控制 [*]
		drag			: true,		//是否启用拖拽 [*]
		fixed			: false,	//是否fixed布局 [*]
		autoFocus		: true,		//打开对话框时，是否自动聚焦 [*]
		autoDestroy		: false,	//关闭对话框时，是否调用this.destroy() 销毁对话框 [*]
		autoReset		: false,	//关闭对话框时，是否调用this.reset() 重置宽高，标题，内容，按钮
		buttonsAlign	: 'right',	//按钮对齐方式
		titleAlign		: 'left',	//标题对齐方式
		contentAlign	: 'left',	//内容对齐方式
		title 			: '提示',	//标题
		content 		: '',		//内容
		buttons 		: [],		//按钮
		top 			: null,		//top值 [*]
		left 			: null,		//left值 [*]
		bottom 			: null,		//bottom值 [*]
		right 			: null,		//right值 [*]
		width 			: 0,		//宽度 [*]
		height 			: 0,		//高度 [*]
		gap 			: 10,				//默认间隙 [*]
		countdown 		: 0,				//等待若干秒之后自动关闭对话框，0:不自动关闭对话框 [*]
		enterCall		: 'confirm,close',	//当hotkeys为true时 按回车键执行... [*]
		escCall			: 'cancel,close',	//当hotkeys为true时 按退出键执行... [*]
		countdownCall	: 'close',			//倒计时结束后执行... [*]
		onClose 		: null,		//关闭之前调用 return false 取消默认操作(关闭，打开，接受，取消) [*]
		onOpen			: null,		//打开之前调用 [*]
		onConfirm		: null,		//确认时调用 [*]
		onCancel		: null		//取消时调用 [*]

	};

	//元素模板
	var $mask = $('<div class="mgDialog_mask" style="z-index:'+_baseZ+'"></div>'),
		$wrap = $('<div class="mgDialog"></div>'),
		$cross = $('<i class="mgDialog_cross" data-role="btn:cancel,close">×</i>'),
		$title = $('<div data-role="title" class="mgDialog_title"></div>'),
		$header = $('<div class="mgDialog_header"></div>'),
		$content = $('<div data-role="content" class="mgDialog_content"></div>'),
		$btn = $('<a class="mgDialog_button"></a>'),
		$footer = $('<div class="mgDialog_footer">'),
		/*
		* 初始化时，复制$hk插入wrap内，open时获得焦点，
		* 目的是让其他表单元素失去焦点，使按回车时不触发表单元素上的click事件，排除dialog上回车键绑定事件的干扰
		* */
		$hk = $('<input type="text" class="mgDialog_hk">'),
		$gap = $('<i class="mgDialog_gap"></i>'), //用于撑开对话框右下角的gap
		$document = $(document);

	//中间值
	var _hasMask = 0,  //背景遮罩计数
		_opened = 0,   //已打开对话框计数
		_focus = '',   //当前焦点对话框id
		_dialogs = {}, //已实例化对话框集合，以id作键
		_timer;

	//获取 animationend 事件名兼容写法
	var aniEndName = (function() {
		var eleStyle = document.createElement('div').style;
		var verdors = ['a', 'webkitA', 'MozA', 'OA', 'msA'];
		var endEvents = ['animationend', 'webkitAnimationEnd', 'animationend', 'oAnimationEnd', 'MSAnimationEnd'];
		var animation;
		for (var i = 0, len = verdors.length; i < len; i++) {
			animation = verdors[i] + 'nimation';
			if (animation in eleStyle) {
				return endEvents[i];
			}
		}
	}());

	function getId(){
		var n = 'd' + Math.random().toString().substring(2,12);
		return _dialogs[n] ? getId() : n;
	}

	function removeDialog(id){
		delete _dialogs[id];
	}

	function addDialog(dialog){
		_dialogs[dialog._id] = dialog;
	}

	//根据id使对话框获得焦点(如果noFocus=true，则只移动到最高层，并不获得焦点)
	function focusDialog(id,noFocus){
		var max = -1000;
		var current = _dialogs[id];
		var other;

		if(_opened <= 1){
			current._zIndex = _baseZ + 1;
		}else{
			for(name in _dialogs){
				other = _dialogs[name];

				if(other._bOpen){
					max = other._zIndex > max ? other._zIndex : max;
					!noFocus && other.dom.wrap.removeClass('mgDialog_focus');
				}

			}

			current._zIndex = max + 1;
		}
		if(!noFocus){
			_focus = id;
			current.dom.wrap.addClass('mgDialog_focus');
		}
		current.dom.wrap.css('z-index',current._zIndex);

	}

	//最高层对话框（_zIndex最大,且忽略autoFocus=false）获得焦点
	function focusLast(){
		if(_opened === 0) return;

		var max = -1000;
		var id = '';
		var current;
		for(name in _dialogs){
			current = _dialogs[name];
			if(current._bOpen){
				if(current._zIndex > max && current.config.autoFocus){
					max = current._zIndex;
					id = current._id;
				}
				current.dom.wrap.removeClass('mgDialog_focus');
			}
		}

		_focus = id;
		_dialogs[id] && _dialogs[id].dom.wrap.addClass('mgDialog_focus');

	}

	//拖拽
	function drag(dialog){
		dialog.dom.wrap.on('mousedown',{dialog:dialog},downFn);
	}

	function downFn(e){
		var oEvent = e.originalEvent,
			src = $(oEvent.srcElement);
		if((src.data('role') === 'content' || src.parents('[data-role=content]').length > 0) && (src.attr(_dargMark) === undefined)) return;

		var dialog = e.data.dialog,
			wrap = dialog.dom.wrap[0],
			disY = oEvent.clientY-wrap.offsetTop,
			disX = oEvent.clientX-wrap.offsetLeft;

		focusDialog(dialog._id);
		$document.on('mousemove',{disY:disY,disX:disX,dialog:dialog},moveFn).on('mouseup',{wrap:wrap},upFn);
		$document.one('mousemove',{wrap:wrap},rePosition);

		wrap.setCapture && wrap.setCapture();

		return false;
	}

	function moveFn(e){
		var oEvent =  e.originalEvent,
			disY = e.data.disY,
			disX = e.data.disX,
			dialog = e.data.dialog,
			wrap = dialog.dom.wrap[0];

		var t = oEvent.clientY - disY;
		var l = oEvent.clientX - disX;

		if(!dialog.config.fixed){
			var gap = dialog.config.gap;
			if(t < gap) t = gap;
			if(l < gap) l = gap;
		}

		wrap.style.top = t +'px';
		wrap.style.left = l +'px';
	}

	function upFn(e){
		var wrap = e.data.wrap;
		$document.off('mousemove',moveFn).off('mouseup',upFn);

		wrap.releaseCapture && wrap.releaseCapture();
	}

	function rePosition(e){
		var wrap = e.data.wrap;
		wrap.style.bottom = 'auto';
		wrap.style.right = 'auto';
	}

	function getHtml(text){
		return typeof text === 'string' ? text.replace(_cdReg,_stCD) : '';
	}

	function st(){
		return $document.scrollTop();
	}

	function sl(){
		return $document.scrollLeft();
	}

	function cw(){
		return document.documentElement.clientWidth;
	}

	function ch(){
		return document.documentElement.clientHeight;
	}


	$(window).on('resize',windowResize);
	function windowResize(){
		clearTimeout(_timer);

		_timer = setTimeout(function(){
			for(name in _dialogs){
				_dialogs[name].setPosition()
			}
		},600);

	}

	var Dialog = function (cfg,userWrap){

		cfg = cfg || {};

		this.config = $.extend({},_config,cfg || {});

		this.dom = {
			wrap : userWrap,
			hk : $hk.clone(),
			gap : $gap.clone(),
			footer : null,
			footHolder : null,
			buttons : null
		};

		this._bUserWrap = !!userWrap;
		this._bOpen = false;
		this._id = getId();
		//this._oldStyle = null;
		//this._oldClass = null;
		this._zIndex = '';
		this._bCD = parseInt(this.config.countdown) > 0;
		this._oldW = 0;
		this._oldH = 0;

		var that = this;

		//键盘事件
		this._hotkey = function(e){
			var kc = e.originalEvent.keyCode;

			var nodeName = document.activeElement.nodeName;

			if(_focus === that._id){
				if(kc === 13 && (nodeName !== 'INPUT' && nodeName !== 'TEXTAREA' || $(document.activeElement).hasClass('mgDialog_hk'))){
					that.trigger(that.config.enterCall);

				}else if(kc ===27){
					that.trigger(that.config.escCall);
				}
			}
		};

		//按钮委托事件
		this._click = function (e){

			var target = $(e.target),
				role = target.data('role');

			//执行按钮标记的函数
			if(role && /^btn:/.test(role) && !target.hasClass('disabled')){
				that.trigger(role.split(':')[1].split(','))
			}
		};

		this.init();

	};

	Dialog.prototype = {
		//_
		init : function(){
			var dom = this.dom,
				config = this.config;

			dom.wrap = dom.wrap ? dom.wrap.append(this.dom.hk).append(this.dom.gap) : this.createWrap();

			if(this._bUserWrap){
				this._oldStyle = dom.wrap.attr('style');
				this._oldClass = dom.wrap.attr('class');
				dom.wrap.addClass('mgDialogU');
			}else{
				dom.wrap.appendTo($('body'));
			}

			dom.wrap.on('click',this._click);

			!!config.width && dom.wrap.css('width',config.width);
			!!config.height && dom.wrap.css('height',config.height);

			addDialog(this);

			config.drag && drag(this);
			this.setGap();
		},
		//_
		createWrap : function(){

			var config = this.config;
			var wrap = $wrap.clone();

			//创建标题
			if(config.hasTitle){
				var header = $header.clone();
				var title = getHtml(config.title);
				this.dom.title = $title.clone();

				header.append(this.dom.title.html(title)).addClass('mgDialog_align_' + config.titleAlign);
				config.hasCross && header.append($cross.clone());
				wrap.append(header);
			}else{
				config.hasCross && wrap.append($cross.clone());
			}

			//创建内容
			this.dom.content = $content.clone();
			wrap.append(this.dom.content.css('text-align',config.contentAlign).html(getHtml(config.content))).append(this.dom.hk).append(this.dom.gap);

			//创建按钮
			if($.isArray(config.buttons) && config.buttons.length > 0){
				this.dom.footer = $footer.clone().addClass('mgDialog_align_' + config.buttonsAlign + ' mgDialog_footer_fixed').css('text-align',config.buttonsAlign);
				wrap.append(this.dom.footer.append(this.cerateButtons(this.config.buttons)));
			}

			return wrap;

		},
		//_
		cerateButtons : function(arr){
			var btns;
			for(var i= 0,b; b = arr[i]; i++){
				btns = btns ? btns.add(newBtn(b)) : newBtn(b);
			}

			function newBtn(b){
				var btn,text,call;
				if(typeof b === 'string'){
					btn = $(b)
				}else if(typeof b === 'object'){
					btn = $btn.clone();
					text = getHtml(b.text);

					if(b.type === 'confirm'){
						text = text || '确定';
						call = b.call || 'confirm,close';
						btn.addClass('mgDialog_button_confirm');

					}else if(b.type === 'cancel'){
						text = text || '取消';
						call = b.call || 'cancel,close';

					}else{
						text = text || '按钮';
						call = b.call || '';
					}

					btn.html(text).attr('data-role','btn:' + call);
				}

				b.disabled && btn.addClass('disabled');
				b.hidden && btn.addClass('mgDialog_hidden');

				return btn;
			}

			this.dom.buttons = btns;

			return btns;


		},
		//_
		setGap : function(){
			var gap = this.config.gap,
				wrap = this.dom.wrap;

			this.dom.gap.css({
				right : - parseInt(wrap.css('border-right-width') || 0) - gap,
				width : gap,
				bottom : - parseInt(wrap.css('border-bottom-width') || 0) - gap,
				height : gap
			});
		},
		//_
		setFooterHolder : function(){
			if(this._bUserWrap) return;

			var footer = this.dom.footer;
			if(footer){
				var h = footer.outerHeight() + 15;
				this.dom.content.css('margin-bottom',h);
			}

		},
		//_
		test : function(b,fn){

			if(b === false){
				return  false
			}else{
				return  typeof fn !== 'function' ? true : fn.call(this) !== false ;
			}

		},
		//_
		setPosition : function(){
			this.setFooterHolder();

			var wrap = this.dom.wrap,
				config = this.config,
				clientW = cw(),
				clientH = ch(),
				scrollTop = st(),
				scrollLeft = sl(),
				width = wrap.outerWidth(),
				height = wrap.outerHeight(),
				positionX = 0,
				positionY = 0,
				dirX = typeof config.left === 'number' ? 'left' : typeof config.right === 'number' ? 'right' : 'center',
				dirY = typeof config.top === 'number' ? 'top' : typeof config.bottom === 'number' ? 'bottom' : 'center';

			var _top,_left;

			wrap.css({
				left : 'auto',
				top : 'auto',
				right : 'auto',
				bottom : 'auto'
			});

			if(config.fixed){
				if(dirY === 'center'){
					dirY = 'top';
					_top = (clientH - height)/2;
					positionY = _top < 10 ? 10 : _top;
				}else{
					positionY = config[dirY];
				}

				if(dirX === 'center'){
					dirX = 'left';
					_left = (clientW - width)/2;
					positionX = _left < 10 ? 10 : _left;
				}else{
					positionX = config[dirX];
				}

				wrap.css('position','fixed').css(dirY,positionY + 'px').css(dirX,positionX + 'px');

			}else{
				if(dirY === 'center'){
					_top = scrollTop + (clientH - height)/2;
					positionY = _top - 10 < scrollTop ? scrollTop + 10 : _top;
				}else{
					positionY = dirY === 'bottom' ? scrollTop + clientH - height - config[dirY] : scrollTop + config[dirY];
				}

				if(dirX === 'center'){
					_left = scrollLeft + (clientW - width)/2;
					positionX = _left - 10 < scrollLeft ? scrollLeft + 10 : _left;
				}else{
					positionX = dirX === 'right' ? scrollLeft + clientW - width - config[dirX] : scrollLeft + config[dirX];
				}

				wrap.css('top',positionY + 'px').css('left',positionX + 'px');
			}

			this._oldW = width;
			this._oldH = height;

		},
		//*
		open : function(b){

			if(this._bOpen === true || this.test(b,this.config.onOpen) === false) return this;

			_opened ++;

			focusDialog(this._id,!this.config.autoFocus);

			this._bOpen = true;

			var that = this,
				wrap = this.dom.wrap,
				config = this.config;

			if(config.hasMask){
				if(_hasMask === 0){
					$mask.prependTo($('body')).addClass('mgDialog_show').data('scroll',{
						t : st(),
						l : sl()
					});
				}
				_hasMask ++;
			}

			wrap.addClass('mgDialog_show');

			this.setPosition();

			this.dom.hk[0].focus();

			if(this._bCD){
				var cd = this.config.countdown;
				var cdWrap = wrap.find('[data-role=cd]');

				cdWrap.text(cd);

				this.cdTimer = setInterval(function(){

					cd --;
					if(cd > 0){
						cdWrap.text(cd);
					}else{
						cdWrap.text(0);
						clearInterval(that.cdTimer);
						that.trigger(that.config.countdownCall);

					}

				},1000)
			}

			this.config.hotKeys && $(document).on('keyup',this._hotkey);

			return this;
		},
		//*
		close : function(b){
			if(this._bOpen === false || this.test(b,this.config.onClose) === false) return this;

			var that = this;
			var wrap = this.dom.wrap;
			that._bOpen = false;

			if(aniEndName){
				wrap.addClass('mgDialog_aniBack');
				wrap.one(aniEndName, end);
			}else{
				end();
			}

			function end (){

				that.config.hotKeys && $(document).off('keyup',that._hotkey);

				that.cdTimer && clearInterval(that.cdTimer);

				wrap.removeClass('mgDialog_show mgDialog_aniBack');

				_opened --;
				if(_opened < 0) _opened = 0;

				if(that.config.hasMask){
					_hasMask --;
					if(_hasMask < 0) _hasMask = 0;
					if(_hasMask === 0){
						var s = $mask.data('scroll');
						$document.scrollTop(s.t).scrollLeft(s.l);
						$mask.removeClass('mgDialog_show').remove();
					}
				}

				focusLast();
				that.config.autoReset && that.reset();
				that.config.autoDestroy && that.destroy();
			}

			return this;

		},
		//* 接收数组如：['confirm','close'] 或者 字符串如：'confirm,close'
		title : function(tit){
			var title = this.dom.wrap.find('[data-role=title]');
			typeof tit === 'string' ? title.html(tit) : title.empty().append(tit);
			return this;

		},
		//*
		content : function(cont){
			var content = this.dom.wrap.find('[data-role=content]');
			typeof cont === 'string' ? content.html(cont) : content.empty().append(cont);
			return this;

		},
		//*
		width : function(num){
			this.dom.wrap.width(num);
			return this;
		},
		//*
		height : function(num){
			this.dom.wrap.height(num);
			return this;

		},
		button : function(index,opt){
			var btn = this.dom.buttons.eq(index);

			if(typeof opt.text === 'string'){
				btn.html(opt.text);
			}

			if(typeof opt.call === 'string'){
				btn.data('role','btn:' + opt.call);
			}

			if(typeof opt.disabled === 'boolean'){
				opt.disabled ? btn.addClass('disabled') : btn.removeClass('disabled');
			}

			if(typeof opt.hidden === 'boolean'){
				opt.hidden ? btn.addClass('mgDialog_hidden') : btn.removeClass('mgDialog_hidden');
			}

			if(opt.type === 'confirm'){
				btn.addClass('mgDialog_button_confirm')
			}else if(opt.type === 'cancel'){
				btn.removeClass('mgDialog_button_confirm')
			}

			return this;

		},
		//*
		countdown : function(cd,fb){
			var that = this;
			if(typeof cd === 'number' && cd > 0){
				var cdWrap = this.dom.wrap.find('[data-role=cd]');

				cdWrap.text(cd);

				clearInterval(this.cdTimer);
				this.cdTimer = setInterval(function(){

					cd --;
					if(cd > 0){
						cdWrap.text(cd);
					}else{
						cdWrap.text(0);
						clearInterval(that.cdTimer);
						if(typeof fb === 'function'){
							fb.call(this)
						}else if(typeof fb === 'string'){
							that.trigger(fb)
						}else{
							that.trigger(that.config.countdownCall);
						}


					}

				},1000)
			}

			return this;
		},
		//* 参数 origin[数字0-12]：定位源，代表时钟方向，0为中心
		position : function(origin){
			this.setFooterHolder();

			var wrap = this.dom.wrap,
				width = wrap.outerWidth(),  //当前宽度
				height = wrap.outerHeight(); //当前高度

			//宽和高都没有变化时return
			if(width === this._oldW && height === this._oldH) return;

			var	config = this.config,
				that = this,
				clientW = cw(), //可视区域宽度
				clientH = ch(), //可视区域高度
				scrollTop = config.fixed ? 0 : st(), //滚动高度 如果fixed定位 记为0
				scrollLeft = config.fixed ? 0 : sl(), //滚动左侧 如果fixed定位 记为0
				top = isNaN(parseInt(wrap.css('top'))) ? clientH - parseInt(wrap.css('bottom')) - that._oldH : parseInt(wrap.css('top')), //当前top值
				left = isNaN(parseInt(wrap.css('left'))) ? clientW - parseInt(wrap.css('right')) - that._oldW : parseInt(wrap.css('left')), //当前left值
				gap = parseInt(this.config.gap) || 0; //定位时与屏幕四边的最小距离

			var _top,_left,resTop,resLeft;//y方向定位差，x方向定位差，结果top值，结果left值

			//获取定位源，默认center
			origin = typeof origin === 'number' && origin >=0  && origin <13 ? Math.floor(origin) : 0;
			var aOriMap = ['center','top','right','bottom','left'],
				aOrigin = [[0,0],[2,1],[2,1],[2,0],[2,3],[2,3],[0,3],[4,3],[4,3],[4,0],[4,1],[4,1],[0,1]],
				oriX = aOriMap[aOrigin[origin][0]],
				oriY = aOriMap[aOrigin[origin][1]];

			//y方向
			if(oriY === 'center'){

				//对话框高度+间隙 小于 屏幕高度的时候，中心定位
				if(height + gap*2 < clientH){

					//定位差
					_top = top - (height - this._oldH)/2;

					//对话框底部超出可视区域时，top取最大距离
					if(_top + gap + height - scrollTop > clientH){
						resTop = scrollTop + clientH - height - gap;

						//对话框顶部超出可视区域时，top取最小距离
					}else if(_top - gap < scrollTop){

						resTop = scrollTop + gap;

						//两头都在可视区域nei，top直接取差值
					}else{

						resTop = _top;
					}

					//对话框高度+间隙 大于 屏幕高度的时候，底部位置保持不变
				}else{
					resTop = top - (height - this._oldH);
				}

			}else if(oriY === 'top'){

				if(config.fixed){
					resTop = top;
				}

			}else if(oriY === 'bottom'){
				resTop = top - (height - this._oldH);
			}

			//x方向逻辑同y方向
			if(oriX === 'center'){

				if(width + gap*2 < clientW){

					_left = left - (width - this._oldW)/2;

					if(_left + gap + width - scrollLeft > clientW){
						resLeft = scrollLeft + clientW - width - gap;

					}else if(_left - gap < scrollLeft){

						resLeft = scrollLeft + gap;

					}else{

						resLeft = _left;
					}

				}else{
					resLeft = left - (width - this._oldW);
				}

			}else if(oriX === 'left'){

				if(config.fixed){
					resLeft = left;
				}

			}else if(oriX === 'right'){
				resLeft = left - (width - this._oldW);
			}

			//顶部和左侧保持不超出一个间隙
			if(!config.fixed){
				if(resTop < gap) resTop = gap;
				if(resLeft < gap) resLeft = gap;
			}

			wrap.css({'top':resTop + 'px','left':resLeft + 'px'});
			$document.off('mousemove',rePosition);

			this._oldW = width;
			this._oldH = height;

			return this;
		},
		reset : function(){
			if(!this._bUserWrap){
				var dom = this.dom;
				var config = this.config;

				//重置宽高
				dom.wrap.css('width',!!config.width ? config.width : '');
				dom.wrap.css('height',!!config.height ? config.height : '');

				//重置标题
				if(config.hasTitle){
					dom.title.html(getHtml(config.title));
				}

				//重置内容
				this.dom.content.html(getHtml(config.content));

				//重置按钮
				this.dom.footer.empty().append(this.cerateButtons(config.buttons))

			}

			return this;
		},
		//*
		trigger : function(fns){
			var config = this.config;
			var fnName = '';

			try{
				var aFn = typeof fns === 'string' ? fns.split(',') : fns;

				for(var i=0,a; a=aFn[i]; i++){

					fnName = 'on' + a.substring(0,1).toUpperCase() + a.substring(1);

					if(a === 'close'){
						this.close();

					}else if(typeof config[fnName] === 'function'){

						if(config[fnName].call(this) === false){
							break;
						}
					}
				}
			}catch (e){}

			return this;

		},
		//*
		destroy : function(){
			removeDialog(this._id);
			this.dom.wrap.off('mousedown',downFn);

			if(this._bOpen){

				if(this.config.hasMask){
					_hasMask --;
					if(_hasMask <= 0){
						$mask.removeClass('mgDialog_show').remove();
						_hasMask = 0
					}
				}

				_opened --;
				if(_opened < 0) _opened = 0;
			}

			this.cdTimer && clearInterval(this.cdTimer);
			this.config.hotKeys && $(document).off('keyup',this._hotkey);
			this.dom.wrap.off('click',this._click);

			$document.off('mousemove',moveFn).off('mouseup',upFn).off('mousemove',rePosition);

			if(this._bUserWrap){
				this.dom.hk.remove();
				this.dom.gap.remove();
				this._oldStyle === undefined ?  this.dom.wrap.removeAttr('style') : this.dom.wrap.attr('style',this._oldStyle);
				this._oldClass === undefined ?  this.dom.wrap.removeAttr('class') : this.dom.wrap.attr('class',this._oldClass);
			}else{
				this.dom.wrap.remove();
			}

			for(name in this.dom){
				this.dom[name] = null;
			}

			for(name in this.config){
				this.config[name] = null;
			}

			this.config = null;
			this.dom = null;
			this.cdTimer = null;
			this._bOpen = null;
			this._bUserWrap = null;
			this._id = null;
			this._oldStyle = null;
			this._oldClass = null;
			this._zIndex = null;
			this._bCD = null;

			this.destroy = function(){};

		}


	};

	$.extend({
		dialog : function(cfg){
			return new Dialog(cfg);
		},
		alert : function(text,title){
			return new Dialog({
				title : title,
				content : text,
				width : 270,
				autoDestroy : true,
				buttons : [{type : 'confirm'}]
			}).open();
		},
		confirm : function(text,fn,title){

			return new Dialog({
				title : title,
				content : text,
				width : 270,
				autoDestroy : true,
				buttons : [
					{type : 'cancel'},
					{type : 'confirm'}
				],
				onConfirm : function(){
					fn(true);
				},
				onCancel : function(){
					fn(false);
				}
			}).open();
		},
		prompt : function(text,fn,title){
			function submit(e){
				if(e.originalEvent.keyCode === 13){
					d.config.onConfirm()

				}
			}

			var d = new Dialog({
				title : title,
				content : text + '<br><input class="mgDialog_promptInput" type="text" value=""/>',
				width : 270,
				autoDestroy : true,
				buttons : [
					{
						type : 'cancel',
						call : 'close'
					},
					{
						type : 'confirm',
						call : 'confirm'
					}
				],
				onOpen : function(){
					$document.on('keyup',submit);
				},
				onConfirm : function(){
					typeof fn === 'function' && fn(input.val());
					d.close();
				},
				onClose : function(){
					input = null;
					$document.off('keyup',submit)
				}
			});

			var input = d.dom.wrap.find('.mgDialog_promptInput');

			d.open();

			input[0].focus();

			return d;

		},
		toast : function(text,width){
			return new Dialog({
				hasTitle : false,
				contentAlign : 'center',
				hasCross : false,
				content : text || 'toast',
				width : width || 'auto',
				autoDestroy : true,
				autoFocus : false,
				countdown : 3,
				hasMask : false,
				hotKeys : false,
				fixed : true,
				bottom : 100
			}).open();
		}
	});

	$.fn.dialog = function(cfg){

		return new Dialog(cfg,this);
	};

})(window,jQuery,document);