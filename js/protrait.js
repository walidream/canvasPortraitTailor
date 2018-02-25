
var app = new Vue({
  el: '#app',
  data: function(){
	return {
		uploadData:{
			uploadImgBox:false,    //控制上传头像盒子
			anewImgBox:false,      //控制重新上传盒子
			negativeImg:new Image(),  //底片
			handleImg:new Image(),   //手柄
			box:{                    //背景盒
				width:360,
				height:360
			},
			filmCanvas:{             //底片盒子
				width:0,
				height:0,
				styleObj:{           //设置样式
					top:0,
					left:0
				}       
			},
			drawCanvas:{             //顶层canvas
				width:0,
				height:0,
				ctx:null
			},
			circle:{                 //圆心          
				x:0,
				y:0,
				r:50
			},
			handleImg:new Image(),  //手柄图片
			handle:{                //手柄坐标，半径
				x:0,
				y:0,
				r:10
			},
			handleFlag:false,   //点击手柄
			coord:{             //鼠标点击时坐标
				x:0,
				y:0
			},
			flag:false,         //点击头像
			dragMouse:false,    //鼠标拖拽样式
			zoomMouse:false,    //鼠标缩放的样式
			imgData:'http://p4mxf46uj.bkt.clouddn.com/protrait/default_protrait.png',       //预览时base64
			pos:0,              //缩放速度
		}
		
	}	
  },
  created:function(){
	  //初始化加载手柄
	  this.uploadData.handleImg.src = 'http://p4mxf46uj.bkt.clouddn.com/userhandle.png';
  },
  methods:{
	  //打开上传box
	  showUpload:function(){ 
		  this.uploadData.uploadImgBox = true;
		  this.uploadData.anewImgBox = false;
	  },
	  //关闭上传box
	  closeUpload:function(){
		  this.uploadData.uploadImgBox = false;
	  },
	  //本地上传
	  uploadPortrait:function(e){
		  let self = this;
		  self.uploadData.anewImgBox = true;  //展示重新上传
		  
		  //预览
		  if(!e.target.files || !e.target.files[0]) return ;
		  let filmCanvas = document.getElementById('filmCanv');
		 
		  let filmCtx = filmCanvas.getContext('2d');
		  if(!filmCtx) alert('浏览器不支持canvas，请升级浏览器');
		  let windowURL = window.URL || window.webkitURL;
		  let imgsrc = windowURL.createObjectURL(e.target.files[0]);
		  
		  //触发底片
		  self.uploadData.negativeImg.onload = function(){
			  let imgW = self.uploadData.negativeImg.width;
			  let imgH = self.uploadData.negativeImg.height;
			  
			  //判断canvas以宽度还是高度为基准
			  let tmpCan = isUpImgWH(imgW,imgH,self.uploadData.box);
			  filmCanvas.width = tmpCan.width;			  
			  filmCanvas.height = tmpCan.height;
			  self.uploadData.filmCanvas.styleObj.top = tmpCan.top;
			  self.uploadData.filmCanvas.styleObj.left = tmpCan.left;
			  
			  //更新底片高度
			  self.uploadData.filmCanvas.width = filmCanvas.width;
			  self.uploadData.filmCanvas.height = filmCanvas.height;
              filmCtx.drawImage(self.uploadData.negativeImg,0,0,filmCanvas.width,filmCanvas.height);
			  
			  //绘制头像
			  let drawCanvas = document.getElementById('drawCanv');
			  drawCanvas.width = self.uploadData.filmCanvas.width;
			  drawCanvas.height = self.uploadData.filmCanvas.height;
			  let drawCtx = drawCanvas.getContext('2d');
			  self.uploadData.drawCanvas.ctx = drawCtx;
			  
			  self.uploadData.drawCanvas.width = self.uploadData.filmCanvas.width;
              self.uploadData.drawCanvas.height = self.uploadData.filmCanvas.height;
			  
			  self.uploadData.circle.x = drawCanvas.width / 2;
			  self.uploadData.circle.y = drawCanvas.height / 2;
			  
			  self.uploadData = clipProtrait(self.uploadData);
			  //预览
			  let imgData = previewProtrait(self.uploadData);
			  self.uploadData.imgData = imgData;

		  }
		  
		  //加载底片
		  self.uploadData.negativeImg.src =  imgsrc;
		  
	  },
	  //鼠标按下
	  downPortrait:function(event){
		  let self = this;
		  self.uploadData.pos = 1;
		  let portraitCircle = getPointDistance(self.uploadData.circle,{x:event.offsetX,y:event.offsetY});
		  let handleCircle = getPointDistance(self.uploadData.handle,{x:event.offsetX,y:event.offsetY});
		  if(handleCircle){ //手柄按下
			self.uploadData.handleFlag = true;
		  }else if(portraitCircle){ //头像按下
			self.uploadData.flag = true;
		  }
		  let ctx = self.uploadData.drawCanvas.ctx;
		  if(ctx && (handleCircle || portraitCircle)){
			self.uploadData.coord.x = event.offsetX;
			self.uploadData.coord.y = event.offsetY;
		  }
	  },
	  //鼠标移动
	  movePortrait:function(event){
		  let self = this;
		  let flag = self.uploadData.flag;
		  let handleFlag = self.uploadData.handleFlag;
		  let ctx = self.uploadData.drawCanvas.ctx;
		  let coord = self.uploadData.coord;
		  let portraitCircle = getPointDistance(self.uploadData.circle,{x:event.offsetX,y:event.offsetY});
		  let handleCircle = getPointDistance(self.uploadData.handle,{x:event.offsetX,y:event.offsetY});
		  //改变鼠标样式
		  if(handleCircle){ //手柄
			self.uploadData.zoomMouse = true;
			self.uploadData.dragMouse = false;
		  }else if(portraitCircle){ //头像
			self.uploadData.dragMouse = true; //拖动样式
			self.uploadData.zoomMouse = false;
		  }else {
			self.uploadData.dragMouse = false;
			self.uploadData.zoomMouse = false;
		  };
		  
		  //执行事件
		  if(ctx && handleFlag){
			let direction = coord.x - event.offsetX;
			//判断是放大还是缩小
			if(direction > 0){
			  self.uploadData.pos--;
			  self.uploadData.circle.r -= Math.abs(self.uploadData.pos);
			}else if(direction < 0){
			  self.uploadData.pos++;
			  self.uploadData.circle.r += Math.abs(self.uploadData.pos);
			}else return ;
			
			//判断头像是否超出最小最大值
			if(self.uploadData.circle.r < 30) self.uploadData.circle.r = 30;
			//判断图片宽度和高度哪个小，头像放大的半径不能超过最小的那个值
			if(self.uploadData.drawCanvas.width > self.uploadData.drawCanvas.height){
				if(self.uploadData.circle.r > Math.floor(self.uploadData.drawCanvas.height /2) ) self.uploadData.circle.r = Math.floor(self.uploadData.drawCanvas.height /2);
			}else if(self.uploadData.drawCanvas.height > self.uploadData.drawCanvas.width){
				if(self.uploadData.circle.r > Math.floor(self.uploadData.drawCanvas.width /2) ) self.uploadData.circle.r = Math.floor(self.uploadData.drawCanvas.width /2);
			}
			
			//头像裁剪
			self.uploadData = clipProtrait(self.uploadData);
			//更新预览
			let imgData = previewProtrait(self.uploadData);
			self.uploadData.imgData = imgData;
		  }else if(ctx && flag){
			let distanceX = self.uploadData.coord.x - event.offsetX;
			let distanceY = self.uploadData.coord.y - event.offsetY;
			//更新鼠标坐标
			self.uploadData.coord.x = event.offsetX;
			self.uploadData.coord.y = event.offsetY;
			//更新圆的坐标
			self.uploadData.circle.x = self.uploadData.circle.x - distanceX;
			self.uploadData.circle.y = self.uploadData.circle.y - distanceY;

			//头像裁剪
			self.uploadData = clipProtrait(self.uploadData);
			//更新预览
			let imgData = previewProtrait(self.uploadData);
			self.uploadData.imgData = imgData;
		  }
		  
		  
	  },
	  //鼠标放开
	  upPortrait:function(event){
		  let self = this;
		  self.uploadData.pos = 0;
		  self.uploadData.flag = false;  
		  self.uploadData.handleFlag = false;
	  },
	  //保存图片到后台
	  saveUploadPortrait:function(){
		  let self = this;
		  //这里有两种放在将裁剪的图片发送给后台
		  //主要：这里的url就是将图片发送给后台的地址 例如：http://www.example.com/up/
		  
		  //第一种，向后台传递 base64
		  $.post('url',{'img':self.uploadData.imgData},function(){  
			//后台成功返回
		  });
		  //第二种，向后台发送文件，这就需要把base64的数据转化成文件
		  let formData = new FormData();
		  let imgBlog = convertBase64UrlToBlob(self.uploadData.imgData); //将base64转化file
		  formData.append('file', imgBlog);
		  $.post('url',formData,function(){
			  //后台成功返回
		  });
	  }
  }
});

//判断本地上传的图片宽度和高度
function isUpImgWH(width,height,box){
	let canW = null;
	let canH = null;
	let offsetTop = 0;  //画布偏移top
	let offsetLeft = 0; //画布偏移left
	//本地图片宽度大于高度
	if(width > height){
		canW = box.width;
		canH = Math.floor((canW * height)/ width);
		
		if(canH > box.width) canH = box.width;
		if(canH == box.width) {
			offsetTop = 0;
			offsetLeft = 0;
		}
		if(canH < box.width){
			offsetTop = Math.floor((box.width - canH)/2);
			offsetLeft = 0;
		}
    //本地图片高度大于等于宽度
	}else{
		canH = box.height;
		canW = Math.floor((width * canH)/height);
		
		if(canW > box.height) canW = box.height;
		if(canW == box.height){
			offsetTop = 0;
			offsetLeft = 0;
		}
		if(canW < box.height){
			offsetLeft = Math.floor((box.height - canW)/2);
			offsetTop = 0;
		}
	}
	
	return {
		width:canW,
		height:canH,
		top:offsetTop + 'px',
		left:offsetLeft + 'px'
	}
}

//绘制头像
function clipProtrait(data){
  
  let canWidth = data.drawCanvas.width;
  let canHeight = data.drawCanvas.height;
  let point = data.circle;
  let ctx = data.drawCanvas.ctx;
  let radius = data.circle.r;
  let handle = data.handle;
  let handleImg = data.handleImg;

  //碰壁检测
  if(data.circle.x < radius) data.circle.x = radius;
  if(data.circle.x > canWidth - radius) data.circle.x = canWidth - radius;
  if(data.circle.y < radius) data.circle.y = radius;
  if(data.circle.y > canHeight - radius) data.circle.y = canHeight - radius;

  ctx.clearRect(0,0,canWidth,canHeight);
  drawRect(ctx,0,0,canWidth,canHeight,0,0,'rgba(0,0,0,0.6)');
  
  //绘制头像
  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x,point.y,radius,0,Math.PI * 2);
  ctx.clip();
  ctx.drawImage(data.negativeImg,0,0,canWidth,canHeight);
  ctx.restore();
  //绘制手柄
  ctx.save();
  ctx.beginPath();
  let tmpPonit = getCircle({x:point.x,y:point.y,r:radius},45);
  ctx.arc(tmpPonit.x,tmpPonit.y,handle.r,0,Math.PI * 2);
  data.handle.x = tmpPonit.x;
  data.handle.y = tmpPonit.y;
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.clip();
  ctx.restore();
  ctx.drawImage(handleImg,tmpPonit.x - handle.r - 3,tmpPonit.y - handle.r - 3,26,26);
  data.drawCanvas.ctx = ctx;

  return data;
}

//绘制矩形
function drawRect(cxt,x,y,width,height,BW,BC,fillColor){
  cxt.beginPath();
  cxt.moveTo(x,y);
  cxt.lineTo(x+width,y);
  cxt.lineTo(x+width,y+height);
  cxt.lineTo(x,y+height);
  cxt.closePath();

  cxt.lineWidth = BW;
  cxt.fillStyle = fillColor;
  cxt.strokeStyle = BC;

  cxt.fill();
  cxt.stroke();
}

//预览
function previewProtrait(data){
  let imgW = data.negativeImg.width;
  let imgH = data.negativeImg.height;
  let point = data.circle;
  let k = imgW / data.drawCanvas.width;
  let sx = Math.floor((point.x - data.circle.r) * (imgW / data.drawCanvas.width)) ;
  let sy = Math.floor((point.y - data.circle.r) * (imgH / data.drawCanvas.height));
  let sW = Math.floor(2 * point.r * k);
  let sH = Math.floor(2 * point.r * k);

  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');
  canvas.width = 290;
  canvas.height = 290;
  drawRect(ctx,0,0,canvas.width,canvas.height,0,0,'#000');
  ctx.drawImage(data.negativeImg,sx,sy,sW,sH,0,0,canvas.width,canvas.height);
  let imgData = canvas.toDataURL("image/jpeg", 1);

  return imgData;
}

//获取圆上任意地点坐标
function getCircle(circle,angle){
  let obj = {};
  obj.x = circle.x + circle.r * Math.cos(angle * Math.PI / 180);
  obj.y = circle.y + circle.r * Math.sin(angle * Math.PI / 180);
  return obj;
}

//两点间的距离
function getPointDistance(point1,point2){
  let count = (point1.x * point1.x) -(2 * point1.x * point2.x) + (point2.x * point2.x) + (point1.y * point1.y) -(2 * point1.y * point2.y) + (point2.y * point2.y);
  let tmpd1 = Math.sqrt( count);
  if(point1.r > tmpd1){
    return true;
  }
  return false;
}

/**
 * 将以base64的图片url数据转换为Blob
 * @param urlData
 * 用url方式表示的base64图片数据
 */
function convertBase64UrlToBlob(urlData){
  var bytes=window.atob(urlData.split(',')[1]);        //去掉url的头，并转换为byte
  //处理异常,将ascii码小于0的转换为大于0
  var ab = new ArrayBuffer(bytes.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < bytes.length; i++) {
    ia[i] = bytes.charCodeAt(i);
  }

  return new Blob( [ab] , {type : 'image/png'});
}
































































