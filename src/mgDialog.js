/*!
* mgDialog 基于jQuery的对话框组件
* author: Mango
* version: 0.1
*
* 实现功能:
* [√] 1.结构可配置:标题，按钮，关闭X，遮罩(模态)
* [√] 2.可完全自定义dom结构
* [√] 3.两种定位方式:absolute(默认)、fixed
* [√] 4.事件可配置:按钮，按键，计时
* [√] 5.自定义事件
* [√] 6.按键监听
* [√] 7.倒计时
* [√] 8.出入场动画
* [√] 9.多窗口
* [√] 10.拖拽
* [√] 11.内置方法 alert confirm prompt toast
*
* open(b)
* close(b)
* destroy()
* getButton(index,id)
*
* 期望：
* title(str|jqObj)
* content(str|jqObj)
* buttons(str|jqObj)
* focus()
* blur()
* width(num)
* height(num)
* reset()
* autoFocus
* 链式调用
*
* */
(function(window,$){
	//全局配置
	var _config = {
		hasMask  : true,  //是否启用背景遮罩
		hasTitle : true,  //是否有标题
		hasCross : true,  //是否有关闭按钮X
		hotKeys  : true,  //是否启用键盘控制
		drag     : true,  //是否启用拖拽
		fixed    : false, //是否fixed布局
		defaultTitle : '提示',    //标题默认文字
		buttonsAlign : 'right',  //按钮对齐方式
		titleAlign   : 'left',   //标题对齐方式
		contentAlign : 'left'    //内容对齐方式
	};

	var _baseZ = 1000; //z-index基准
	var btnReg = /^btn:/;
	var cdReg = /{%cd}/gi;

	var $mask = $('<div class="mgDialog_mask" style="z-index:'+_baseZ+'"></div>'),
		$wrap = $('<div class="mgDialog"></div>'),
		$cross = $('<i class="mgDialog_cross" data-role="btn:cancel,close">×</i>'),
		$title = $('<div data-role="title" class="mgDialog_title"></div>'),
		$header = $('<div class="mgDialog_header"></div>'),
		$content = $('<div data-role="content" class="mgDialog_content"></div>'),
		$btn = $('<button class="mgDialog_button"></button>'),
		$footer = $('<div data-role="footer" class="mgDialog_footer">'),
		/*
		* 初始化时，复制$hk插入wrap内，open时获得焦点，
		* 目的是让其他表单元素失去焦点，使按回车时不触发表单元素上的click事件，排除dialog上回车键绑定事件的干扰
		* */
		$hk = $('<input type="text" class="mgDialog_hk">'),
		$document = $(document);

	var stCD = '<span data-role="cd"></span>';	

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

	var _hasMask = 0,  //背景遮罩计数
		_opened = 0,   //已打开对话框计数
		_focus = '',   //当前焦点对话框id
		_dialogs = {}; //已实例化对话框集合，以id作键

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

	function focusDialog(id){
		id ? focusCurrent(id) : focusLast();
	}

	//根据id使对话框获得焦点
	function focusCurrent(id){
		//if(_focus === id) return;

		var max = -1000;
		var current = _dialogs[id];
		var other;

		if(_opened <= 1){
			current._zIndex = _baseZ + 1
		}else{
			for(name in _dialogs){
				other = _dialogs[name];

				if(other._bOpen){
					max = other._zIndex > max ? other._zIndex : max;
					other.dom.wrap.removeClass('mgDialog_focus');
				}

			}

			current._zIndex = max + 1;
		}
		//setTimeout(function(){
			_focus = id;
			current.dom.wrap.addClass('mgDialog_focus').css('z-index',current._zIndex)
		//},50)

	}

	//最高层对话框（_zIndex最大）获得焦点
	function focusLast(){
		if(_opened === 0) return;

		var max = -1000;
		var id = '';
		var current;
		for(name in _dialogs){
			current = _dialogs[name];
			if(current._bOpen){
				if(current._zIndex > max){
					max = current._zIndex;
					id = current._id;
				}
				current.dom.wrap.removeClass('mgDialog_focus');
			}
		}

		setTimeout(function(){
			_focus = id;
			_dialogs[id].dom.wrap.addClass('mgDialog_focus');
		},50)

	}

	//拖拽
	function drag(obj,id){
		obj.on('mousedown',{id:id,obj:obj},downFn);
	}

	function downFn(e){
		var id = e.data.id;
		var item = e.data.obj[0];
		focusDialog(id);

		var oEvent = e.originalEvent;
		var disY = oEvent.clientY-item.offsetTop;
		var disX = oEvent.clientX-item.offsetLeft;
		$document.on('mousemove',{disY:disY,disX:disX,item:item},moveFn).on('mouseup',{item:item},upFn);
		$document.one('mousemove',{item:item},rePosition)

		item.setCapture && item.setCapture();

		return false;
	}

	function moveFn(e){
		var oEvent =  e.originalEvent;
		var disY = e.data.disY;
		var disX = e.data.disX;
		var item = e.data.item;

		var t=oEvent.clientY - disY;
		var l=oEvent.clientX - disX;
		item.style.top = t +'px';
		item.style.left = l +'px';
	}

	function upFn(e){
		var item = e.data.item;
		$document.off('mousemove',moveFn).off('mouseup',upFn);

		item.releaseCapture && item.releaseCapture();
	}

	function rePosition(e){
		var item = e.data.item;
		item.style.bottom = 'auto';
		item.style.right = 'auto';
	}

	var Dialog = function (cfg,userWrap){
		var config = {
			top : null,
			left : null,
			width : 0,
			height : 0,
			countdown : 0,	//等待若干秒之后自动关闭对话框，0:不自动关闭对话框
			autoDestroy : false, //当close触发时候 是否调用this.destroy()
			//resetButtons : true, //预留 open()时重置按钮
			enterCall : 'confirm,close', //当hotkeys为true时 按回车键执行...
			escCall : 'cancel,close', //当hotkeys为true时 按退出键执行...
			countdownCall : 'close', //倒计时结束后执行...
			onClose : null,  //return false 取消默认操作(关闭，打开，接受，取消)
			onOpen : null,
			onConfirm : null,
			onCancel : null,
			buttons : []
			//例子:
			//buttons : [
			//	{
			//		type : 'confirm',
			//		call : 'confirm,close',
			//		text : '确定',
			//		id : 'xxx',
			//		disabled : false
			//	}
			//]
		};

		cfg = cfg || {};

		this.config = $.extend({},_config,config,cfg);

		this.dom = {
			wrap : userWrap,
			hk : $hk.clone(),
			buttons : null //暂时无用
		};

		this._bUserWrap = !!userWrap;

		this._bOpen = false;
		this._id = getId();
		this._oldZ = '';
		this._zIndex = '';
		this._bCD = typeof this.config.countdown === 'number' && this.config.countdown > 0;

		if(userWrap && userWrap.outerWidth){
			//this.config.width = userWrap.outerWidth();
			//this.config.height = userWrap.outerHeight();
			userWrap.addClass('mgDialog');
		}

		this.init();

		this._hotkey = function(e){
			var kc = e.originalEvent.keyCode;
			var that = e.data.that;

			if(_focus === that._id){
				if(kc === 13){
					that.doFns(that.config.enterCall);
				}else if(kc ===27){
					that.doFns(that.config.escCall);
				}
			}
		};

	}

	Dialog.prototype = {

		init : function(){
			var that = this;
			var dom = this.dom;
			var config = this.config;

			dom.wrap = dom.wrap ? dom.wrap.append(this.dom.hk) : this.createWrap();

			!!config.width && dom.wrap.css('width',config.width);
			!!config.height && dom.wrap.css('height',config.height);

			this._oldZ = dom.wrap[0].style.zIndex;

			addDialog(this);

			dom.wrap.on('click',click).appendTo($('body'));

			function click(e){

				var target = $(e.target);
				var role = target.data('role');

				//执行按钮标记的函数
				if(role && btnReg.test(role) && !target.hasClass('disabled')){
					that.doFns(role.split(':')[1].split(','))
				}
			}

			config.drag && drag(dom.wrap,this._id)


		},

		//接收数组如：['confirm','close'] 或者 字符串如：'confirm,close'
		doFns : function(fns){
			var config = this.config;
			var fnName = '';

			try{
				var aFn = typeof fns === 'string' ? fns.split(',') : fns;

				for(var i=0,a; a=aFn[i]; i++){

					fnName = 'on' + a.substring(0,1).toUpperCase() + a.substring(1);

					if(a === 'close'){
						this.close();

					}else if(typeof config[fnName] === 'function'){

						if(config[fnName]() === false){
							break;
						}
					}
				}
			}catch (e){}

		},
		createWrap : function(){

			var config = this.config;
			var wrap = $wrap.clone();
			var that = this;

			//创建标题
			if(config.hasTitle){
				var header = $header.clone();
				var title = config.title ? this._bCD ? config.title.replace(cdReg,stCD) : config.title : config.defaultTitle;

				header.append($title.clone().html(title)).addClass('mgDialog_align_' + config.titleAlign);
				config.hasCross && header.append($cross.clone());
				wrap.append(header);
			}else{
				config.hasCross && wrap.append($cross.clone());
			}

			//创建内容
			wrap.append($content.clone().css('text-align',config.contentAlign).html(getHtml(config.content))).append(this.dom.hk);

			//创建按钮
			if(config.buttons && config.buttons.length > 0){
				var footer = $footer.clone().addClass('mgDialog_align_' + config.buttonsAlign).css('text-align',config.buttonsAlign);
				for(var i= 0,b; b = config.buttons[i]; i++){
					footer.append(function(){
						var btn;

						if(typeof b === 'string'){
							btn = $(b)
						}else if(typeof b === 'object'){
							btn = $btn.clone();

							if(b.type === 'confirm'){
								btn.addClass('mgDialog_button_confirm').html(getHtml(b.text) || '确定').attr('data-role','btn:' +  (b.call || 'confirm,close'));
							}else if(b.type === 'cancel'){
								btn.html(getHtml(b.text) || '取消').attr('data-role','btn:' + (b.call || 'cancel,close'));
							}else{
								btn.html(getHtml(b.text) || '按钮').attr('data-role','btn:' + (b.call || ''));
							}
						}

						b.disabled && btn.addClass('disabled');
						typeof b.id === 'string' && b.id !== '' && btn.attr('data-id', b.id);

						return btn;

					})
				}
				wrap.append(footer);
			}

			function getHtml(text){
				return text && that._bCD ? text.replace(cdReg,stCD) : text;
			}

			return wrap;

		},
		open : function(b){

			if(this._bOpen === true || this.test(b,this.config.onOpen) === false) return;

			_opened ++;

			focusDialog(this._id);

			this._bOpen = true;
			var that = this;
			var $body = $('body');
			var wrap = this.dom.wrap;

			if(this.config.hasMask){
				if(_hasMask === 0){
					$mask.addClass('mgDialog_show').appendTo($body.addClass('mgDialog_show'));
				}
				_hasMask ++;

			}

			//this.centerOffset();
			this.setPosition();

			wrap.addClass('mgDialog_show');
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
						that.doFns(that.config.countdownCall);

					}

				},1000)
			}

			this.config.hotKeys && $(document).on('keyup',{that:this},this._hotkey);

		},

		close : function(b){
			if(this._bOpen === false || this.test(b,this.config.onClose) === false) return;

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

				that.dom.wrap.css('z-index',that._oldZ);

				that.cdTimer && clearInterval(that.cdTimer);

				wrap.removeClass('mgDialog_show mgDialog_aniBack');

				_opened --;
				if(_opened < 0) _opened = 0;

				if(that.config.hasMask){
					_hasMask --;
					if(_hasMask < 0) _hasMask = 0;
					if(_hasMask === 0){
						$mask.removeClass('mgDialog_show').remove();
						$('body').removeClass('mgDialog_show');
					}
				}

				focusDialog();

				that.config.autoDestroy && that.destroy();
			}

		},

		test : function(b,fn){

			if(b === false){
				return  false
			}else{
				return  typeof fn !== 'function' ? true : fn() !== false ;
			}

		},
		setPosition : function(){
			var wrap = this.dom.wrap,
				clientW = document.documentElement.clientWidth,
				clientH = document.documentElement.clientHeight,
				scrollTop = document.body.scrollTop || document.documentElement.scrollTop,
				scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft,
				width = wrap.outerWidth(),
				height = wrap.outerHeight();

			var config = this.config;
			var fixed = config.fixed;

			var positionX = 0;
			var positionY = 0;
			var dirX = typeof config.left === 'number' ? 'left' : typeof config.right === 'number' ? 'right' : 'center';
			var dirY = typeof config.top === 'number' ? 'top' : typeof config.bottom === 'number' ? 'bottom' : 'center';

			wrap.css({
				left : 'auto',
				top : 'auto',
				right : 'auto',
				bottom : 'auto'
			});

			if(fixed){
				if(dirY === 'center'){
					dirY = 'top';
					positionY = (clientH - height)/2;
				}else{
					positionY = config[dirY];
				}

				if(dirX === 'center'){
					dirX = 'left';
					positionX = (clientW - width)/2;
				}else{
					positionX = config[dirX];
				}

				wrap.css('position','fixed').css(dirY,positionY + 'px').css(dirX,positionX + 'px');

			}else{
				if(dirY === 'center'){
					positionY = scrollTop + (clientH - height)/2;
				}else{
					positionY = dirY === 'bottom' ? scrollTop + clientH - height - config[dirY] : scrollTop + config[dirY];
				}

				if(dirX === 'center'){
					positionX = scrollLeft + (clientW - width)/2;
				}else{
					positionX = dirX === 'right' ? scrollLeft + clientW - width - config[dirX] : scrollLeft + config[dirX];
				}

				wrap.css('top',positionY + 'px').css('left',positionX + 'px');
			}


		},
		getButton : function(mark){
			var btns = this.dom.wrap.find('.mgDialog_footer .mgDialog_button');
			if(typeof mark === 'number'){
				return btns.eq(mark)
			}else if(typeof mark === 'string'){
				return btns.filter('[data-id='+mark+']');
			}
		},
		destroy : function(){
			removeDialog(this._id);
			this.dom.wrap.off('mousedown',downFn);

			if(this._bOpen && this.config.hasMask){
				_hasMask --;
				if(_hasMask < 0) _hasMask = 0;
				if(_hasMask === 0){
					$mask.removeClass('mgDialog_show').remove();
					$('body').removeClass('mgDialog_show');
				}
			}

			this.cdTimer && clearInterval(this.cdTimer);
			this.config.hotKeys && $(document).off('keyup',this._hotkey);
			this.dom.wrap.off('click');

			if(this._bUserWrap){
				this.dom.hk.remove();
				this.dom.wrap.css('z-index',this._oldZ)
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
			this._oldZ = null;
			this._zIndex = null;
			this._bCD = null;

			this.destroy = function(){};

		}

	};

	$.extend({
		dialog : function(cfg){
			return new Dialog(cfg)
		},
		alert : function(text,title){
			new Dialog({
				title : title,
				content : text,
				width : 270,
				autoDestroy : true,
				buttons : [
					{
						type : 'confirm',
						call : 'close'
					}
				]
			}).open()
		},
		confirm : function(text,fn,title){

			new Dialog({
				title : title,
				content : text,
				width : 270,
				autoDestroy : true,
				buttons : [
					{
						type : 'cancel'
					},
					{
						type : 'confirm'
					}
				],
				onConfirm : function(){
					fn(true);
				},
				onCancel : function(){
					fn(false);
				}
			}).open()
		},
		prompt : function(text,fn,title){

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
						type : 'confirm'
					}
				],
				onConfirm : function(){
					typeof fn === 'function' && fn(input.val())
				},
				onClose : function(){
					input = null;
				}
			});

			var input = d.dom.wrap.find('.mgDialog_promptInput');

			d.open();

			input[0].focus()

		},
		toast : function(text,width){
			new Dialog({
				hasTitle : false,
				contentAlign : 'center',
				hasCross : false,
				content : text || 'toast',
				width : width || 160,
				autoDestroy : true,
				countdown : 3,
				hasMask : false,
				hotKeys : false,
				fixed : true,
				bottom : 100
			}).open()
		}
	});

	$.fn.dialog = function(cfg){

		return new Dialog(cfg,this);
	};

})(window,jQuery);