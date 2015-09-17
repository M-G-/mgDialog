# mgDialog 对话框组件


## 基础

### 实现功能
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

### 基本使用
#### 普通方式

``` javascript
$.dialog({
	content : '这是一个对话框。'
}).open();
```
#### 弹出已存在的dom

html
``` html
<div id="dialog">
	<p>自定义dom的对话框。</p>
</div>
```

javascript
``` javascript
$('#dialog').dialog().open();
```

#### 内置方法

``` javascript
$.alert('这是一个提示框。');
```

### 配置项
0. hasMask
	> 说明：是否启用背景遮罩（模态）；
	> 类型：boolean；
	> 默认值：true；
	
0. hasTitle（自定义dom时，此属性无效）
	> 说明：是否有标题；
	> 类型：boolean；
	> 默认值：true；
	
0. hasCross（自定义dom时，此属性无效）
	> 说明：是否有右上角关闭按钮；
	> 类型：boolean；
	> 默认值：true；
	
0. hotKeys
	> 说明：是否启用键盘控制[enter,esc]；
	> 类型：boolean；
	> 默认值：true；

0. drag
	> 说明：是否启用拖拽；
	> 类型：boolean；
	> 默认值：true；

0. fixed
	> 说明：是否fixed定位；
	> 类型：boolean；
	> 默认值：false；
	
0. autoFocus
	> 说明：打开对话框时，是否自动聚焦（聚焦的对话框会被置于顶层，键盘只会触发已聚焦对话框的事件）；
	> 类型：boolean；
	> 默认值：true；

0. autoDestroy
	> 说明：关闭对话框时，是否调用this.destroy() 销毁对话框；
	> 类型：boolean；
	> 默认值：false；

0. autoReset（自定义dom时，此属性无效）
	> 说明：关闭对话框时，是否调用this.reset() 重置对话框；
	> 类型：boolean；
	> 默认值：false；

0. titleAlign（自定义dom时，此属性无效）
	> 说明：标题对齐方式；
	> 类型：string [left|center|right]；
	> 默认值：left；

0. contentAlign（自定义dom时，此属性无效）
	> 说明：内容对齐方式；
	> 类型：string [left|center|right]；
	> 默认值：left；

0. buttonsAlign（自定义dom时，此属性无效）
	> 说明：按钮对齐方式；
	> 类型：string [left|center|right]；
	> 默认值：right；

0. title（自定义dom时，此属性无效）
	> 说明：标题；
	> 类型：string [文本|html片段]；
	> 默认值：标题；

0. content（自定义dom时，此属性无效）
	> 说明：内容；
	> 类型：string [文本|html片段]；
	> 默认值：空；

0. buttons（自定义dom时，此属性无效）
	> 说明：按钮；
	> 类型：array，定义多个按钮[{},{}]；
	> 默认值：[]；
	
	按钮配置项
	
		* type
			> 说明：按钮类型（定义了样式，默认的文字和call值。）
			> 类型：string [confirm|cancel]
			> 默认值：无
			> confirm：蓝色，文字:确认，call:'confirm,close'
			> cancel：白色，文字:取消，call:'cancel,close'
		* call
			> 说明：事件流（点击按钮时触发）
			> 类型：string [以逗号分隔的事件名称]
			> 默认值：无
		* text
			> 说明：按钮上的文字
			> 类型：string [文本|html片段]
			> 默认值：按钮
		* disabled
			> 说明：是否禁用按钮（被禁用的按钮不会触发事件流）
			> 类型：boolean
			> 默认值：false
		* hidden
			> 说明：是否隐藏按钮
			> 类型：boolean
			> 默认值：false

0. top, right, bottom, left
	> 说明：定位（top, left优先于bottom, right）；
	> 类型：number；
	> 默认值：null （都为null的时候，中心定位）；

0. width, height
	> 说明：尺寸；
	> 类型：number | auto (string)；
	> 默认值：320(width) auto(height)； 

0. gap（fixed定位时此属性无效）
	> 说明：对话框到屏幕边缘的最小距离（px）；
	> 类型：number；
	> 默认值：10；
			
0. countdown
	> 说明：打开对话框时倒计时；
	> 类型：number [>=0]（倒计时秒数）；
	> 默认值：0（不启用倒计时）；

0. enterCall
	> 说明：按回车[enter]键时调用的事件流；
	> 类型：string [事件流]；
	> 默认值：confirm,close；

0. escCall
	> 说明：按退出[esc]键时调用的事件流；
	> 类型：string [事件流]；
	> 默认值：cancel,close；

0. countdownCall
	> 说明：倒计时结束后调用的事件流；
	> 类型：string；
	> 默认值：close；

0. onOpen, onClose, onConfirm, onCancel
	> 说明：内置的事件定义；
	> 类型：function；
	> 默认值：null；
	> 详细：onOpen（对话框打开时调用）、onClose（对话框关闭时调用）、onConfirm（用户确认时调用）、onCancel（用户取消时调用），this指向对话框对象；
	> 自定义事件：任意定义on+大写字母开头的事件，配置其事件流时去掉on，第一个字母小写即可；

### 方法

除了destroy()之外的方法都支持链式调用

0. open()
	> 说明：打开对话框，触发onOpen，如返回false，则不打开对话框；
	> 参数：无；
	> 返回：this；

0. close()
	> 说明：关闭对话框，触发onClose，如返回false，则不关闭对话框；
	> 参数：无；
	> 返回：this；

0. title(text)
	> 说明：修改标题；
	> 参数：string [文本|html]；
	> 返回：this；

0. content(text)
	> 说明：修改内容；
	> 参数：string [文本|html]；
	> 返回：this；

0. button(index,options) （自定义dom时，此方法无效）
	> 说明：修改按钮；
	> 参数：index [number] 按钮索引，options [object] 按钮选项，同对话框配置项buttons（type属性只能修改样式，不再定义默认文字和call）；
	> 返回：this；

0. width(n)
	> 说明：修改对话框宽度；
	> 参数：number | auto(string)；
	> 返回：this；
	
0. height(n)
	> 说明：修改对话框高度；
	> 参数：number | auto(string)；
	> 返回：this；

0. countdown(n,cb)
	> 说明：倒计时；
	> 参数：n [number] 倒计时秒数，cb [string|function] 回调 参数为事件流定义或者函数 默认值是配置项中countdownCall的值；
	> 返回：this；
	
0. position(origin)
	> 说明：对话框重定位，改变对话框大小后可能用到；
	> 参数：origin [number:0-12] 定位源 代表时钟方向 0（默认）为中心定位；
	> 返回：this；
	
0. reset() （自定义dom时，此方法无效）
	> 说明：重置对话框（尺寸，标题，内容，按钮）；
	> 参数：无；
	> 返回：this；
	
0. trigger(call)
	> 说明：调用已定义的事件流；
	> 参数：string [事件流] ；
	> 返回：this；
	
0. destroy()
	> 说明：销毁对话框；
	> 参数：无；
	> 返回：undefined；

### 内置快捷方法

0. $.alert(text,title)
	> 说明：弹出一个提示框；
	> 参数：text [string] 内容，title [string] 标题；
	> 返回：对话框对象；

0. $.confirm(text,fn,title)
	> 说明：弹出一个确认框；
	> 参数：text [string] 内容，fn [function] 回调函数 根据用户选择传入一个boolean值，title [string] 标题；
	> 返回：对话框对象；

0. $.prompt(text,fn,title)
	> 说明：弹出一个输入框；
	> 参数：text [string] 内容，fn [function] 回调函数 传入输入框内容，title [string] 标题；
	> 返回：对话框对象；

0. $.toast(text,width)
	> 说明：弹出一个自动消失的提示框；
	> 参数：text [string] 内容，width [number] 宽度 默认auto；
	> 返回：对话框对象；



## 高级

### 按钮及事件
待续

### 倒计时
待续

### 多窗口
待续

### 自定义dom
待续


## demos
待续


## 综合应用和二次封装
待续

