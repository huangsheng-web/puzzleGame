var data = null;
	imgurl = [],
	linkUrl = [],
	puzzleLives = null , //次数
	today = null,
	curTime = null,
	accum = null,
	userId = location.hash?/\d+/.exec(location.hash)[0]:0,
	minusCoin = null,
	unLogin = true;

$.ajax({
	type: "post",
	url: "http://api.uubaoku.com/Game/GetGameAdvs",
	async: false,
	success:function(str){
		console.log(str)
		data = str.data;
	for(let i = 0; i < data.length; i++) {
		imgurl.push(data[i].ImageUrl);
		linkUrl.push(data[i].LinkUrl);
		}
	}
});
//获取用户的当前优点
$.ajax({
	type:"post",
	url:"http://api.uubaoku.com/User/GetCoins",
	async:false,
	data:{
		UserID:userId,
		Sign:''
	},
	success:function(data){
		if(data&&data.code == 000000){
			data = data.data;
		}else if(data&&data.code == 100008){
			unLogin = false;
		}
		accum = data;
	}
});

setInterval(function(){
//	console.log(new Date().getTime(),new Date().setHours(23,59,59,59),puzzleLives);
	if (new Date().getTime() > new Date().setHours(23,59,59,59)) {

		puzzleLives=10;
		localStorage.setItem('id',JSON.stringify({'lives':puzzleLives,'time':curTime}));
	}
},1000)

function setLocal() {

		puzzleLives = localStorage.getItem('id')?JSON.parse(localStorage.getItem('id')).lives :10;

		console.log(localStorage.getItem('id'),puzzleLives);
		localStorage.setItem('id',JSON.stringify({'lives':puzzleLives,'time':curTime}));

};
var puzzleGame = function(param) {
	this.img = param.img || '';
	$("#reference-img").attr('src', this.img);
	this.btnStart = $('#wrap #left ul #start');
	this.btnLevel = $('#wrap #left ul #level #choice');
	this.imgArea = $('#wrap #right #imgArea');
	this.imgCells = '';
	this.imgOrigArr = [];
	this.imgRandArr = [];
	this.levelArr = [
		[3, 3],
		[4, 4],
		[5, 5]
	];
	this.levelNow = 0;
	this.imgWidth = parseInt(this.imgArea.css('width'));
	this.imgHeight = parseInt(this.imgArea.css('height'));
	this.cellWidth = this.imgWidth / this.levelArr[this.levelNow][1];
	this.cellHeight = this.imgHeight / this.levelArr[this.levelNow][0];
	this.hasStart = 0;
	this.moveTime = 200;
	this.init();
	this.countdown = [10, 20, 60];//事件
	this.tt = null;
	this.data = {};
	this.lisenmove = true;
	this.showclick = $('win-game') || $('lost-game');


}
puzzleGame.prototype = {
	init: function() {
		this.imgSplit();
		this.levelSelect();
		this.gameState();
		this.gameevents();
		this.goLink(0);

	},
	imgSplit: function() {

		this.imgOrigArr = [];
		this.imgArea.html("");
		var cell = '';
		for(var i = 0; i < this.levelArr[this.levelNow][0]; i++) {
			for(var j = 0; j < this.levelArr[this.levelNow][1]; j++) {
				this.imgOrigArr.push(i * this.levelArr[this.levelNow][1] + j);
				cell = document.createElement("div");
				cell.className = "imgCell";
				$(cell).css({
					'width': (this.cellWidth - 2) + 'px',
					'height': (this.cellHeight - 2) + 'px',
					'left': j * this.cellWidth + 'px',
					'top': i * this.cellHeight + 'px',
					"background": "url('" + this.img + "')",
					'backgroundPosition': (-j) * this.cellWidth + 'px ' + (-i) * this.cellHeight + 'px',
					"backgroundRepeat": "no-repeat",
					"backgroundSize": this.imgWidth + 'px ' + this.imgHeight + 'px'
				});
				this.imgArea.append(cell);
			}
		}
		this.imgCells = $('#wrap #right #imgArea div.imgCell');
	},
	levelSelect: function() {

		var len = this.levelArr.length;
		var self = this;
		this.btnLevel.bind('change', function() {
			if(self.hasStart) {
				return false;
			}

			self.levelNow = this.selectedIndex;
			let sen = self.countdown[this.selectedIndex];
			$('#min').text(Math.floor(sen / 60));
			$('#second1').text(Math.floor(sen / 10) < 6 ? Math.floor(sen / 10) : Math.floor(sen / 10) % 6);
			$('#second2').text((sen) % 10);
			self.cellWidth = self.imgWidth / self.levelArr[self.levelNow][1];
			self.cellHeight = self.imgHeight / self.levelArr[self.levelNow][0];
			self.imgSplit();
		});
	},
	gameState: function() {
		var self = this;
		this.btnStart.on('click', function() {
			//判断用户是否登录
			if(unLogin == false){
				$('#unLogin').show();
							setTimeout(function(){
								$('#unLogin').hide();
							},2000)
							return;
			}
			//扣除玩游戏需要的优点
			if(puzzleLives<=0){
				accum = accum;
			}else{
				$.ajax({
				type:"post",
				url:"http://api.uubaoku.com/Game/SubtractYouDian",
				data:{
					UserID:userId,
					Num:20,
					GameName:'拼图'

				}
			});
			}


			//对玩的次数跟今日时间做个判断
			curTime = new Date().getTime();
			today = new Date().setHours(23,59,59,59);
			console.log(curTime,today);

			if(JSON.parse(localStorage.getItem('id'))){
				if(curTime>=today){
					puzzleLives=10;
					localStorage.setItem('id',JSON.stringify({'lives':puzzleLives,'time':curTime}));

					}else{
						if(puzzleLives<=0){
							$('#play-done').show();
							setTimeout(function(){
								$('#play-done').hide();
							},2000)
							return;
						}
					}
					puzzleLives --;
					localStorage.setItem('id',JSON.stringify({'lives':puzzleLives,'time':curTime}));
					setLocal();
				}

			//点击开始按钮 隐藏遮罩层
			$("#win-game")[0].style.visibility = 'hidden';
			$("#lost-game")[0].style.visibility = 'hidden';
//			if(self.hasStart == 0) {
				clearTimeout(self.tt);
				var sen = self.countdown[self.levelNow];

				function settime() {
					if(sen == 0) {
						clearTimeout(self.tt);
						//此处游戏时间结束的代码  弹出遮罩层
						$('#lost-game')[0].style.visibility = 'visible';
						self.hasStart = 0;
					} else {
						sen--;
					}
				}
				self.tt = setInterval(function() {

					$('#min').text(Math.floor(sen / 60));
					$('#second1').text(Math.floor(sen / 10) < 6 ? Math.floor(sen / 10) : Math.floor(sen / 10) % 6);
					$('#second2').text(sen % 10);
					settime();
				}, 1000)
				$('#choice').attr('disabled', 'disabled');
				self.hasStart = 1;
				self.randomArr();
				self.cellOrder(self.imgRandArr);
				self.imgCells.css({
					'cursor': 'pointer'
				}).on('touchstart', function(e) {
					if(self.lisenmove == false || self.hasStart == 0) {
						return
					};
					self.lisenmove = false;
					var cellIndex_1 = $(this).index();
					var cell_mouse_x = e.originalEvent.targetTouches[0].pageX - self.imgCells.eq(cellIndex_1).offset().left;
					var cell_mouse_y = e.originalEvent.targetTouches[0].pageY - self.imgCells.eq(cellIndex_1).offset().top;
					$(document).on('touchmove', function(e2) {
						self.imgCells.eq(cellIndex_1).css({
							'z-index': '40',
							'left': (e2.originalEvent.targetTouches[0].pageX - cell_mouse_x - self.imgArea.offset().left) + 'px',
							'top': (e2.originalEvent.targetTouches[0].pageY - cell_mouse_y - self.imgArea.offset().top) + 'px'
						});
					}).on('touchend', function(e3) {
						var cellIndex_2 = self.cellChangeIndex((e3.originalEvent.changedTouches[0].pageX - self.imgArea.offset().left), (e3.originalEvent.changedTouches[0].pageY - self.imgArea.offset().top), cellIndex_1);
						if(cellIndex_1 == cellIndex_2) {
							self.cellReturn(cellIndex_1);
						} else {
							self.cellExchange(cellIndex_1, cellIndex_2);
						}
						$(document).off('touchmove').off('touchend');
					});
				});

//			} else if(self.hasStart == 1) {
//				return false;
//			}
		});
	},
	randomArr: function() {
		this.imgRandArr = [];
		var order;
		for(var i = 0, len = this.imgOrigArr.length; i < len; i++) {
			order = Math.floor(Math.random() * len);
			if(this.imgRandArr.length > 0) {
				while(jQuery.inArray(order, this.imgRandArr) > -1) {
					order = Math.floor(Math.random() * len);
				}
			}
			this.imgRandArr.push(order);
		}
		return;
	},
	cellOrder: function(arr) {
		for(var i = 0, len = arr.length; i < len; i++) {
			this.imgCells.eq(i).animate({
				'left': arr[i] % this.levelArr[this.levelNow][1] * this.cellWidth + 'px',
				'top': Math.floor(arr[i] / this.levelArr[this.levelNow][0]) * this.cellHeight + 'px'
			}, this.moveTime);
		}
	},
	cellChangeIndex: function(x, y, orig) {
		if(x < 0 || x > this.imgWidth || y < 0 || y > this.imgHeight) {
			return orig;
		}
		var row = Math.floor(y / this.cellHeight),
			col = Math.floor(x / this.cellWidth),
			location = row * this.levelArr[this.levelNow][1] + col;
		var i = 0,
			len = this.imgRandArr.length;
		while((i < len) && (this.imgRandArr[i] != location)) {
			i++;
		}
		return i;
	},
	cellExchange: function(from, to) {
		var self = this;
		var rowFrom = Math.floor(this.imgRandArr[from] / this.levelArr[this.levelNow][1]);
		var colFrom = this.imgRandArr[from] % this.levelArr[this.levelNow][1];
		var rowTo = Math.floor(this.imgRandArr[to] / this.levelArr[this.levelNow][1]);
		var colTo = this.imgRandArr[to] % this.levelArr[this.levelNow][1];
		var temp = this.imgRandArr[from];
		this.imgCells.eq(from).animate({
			'top': rowTo * this.cellHeight + 'px',
			'left': colTo * this.cellWidth + 'px'
		}, this.moveTime, function() {
			$(this).css('z-index', '10');
		});
		this.imgCells.eq(to).css('z-index', '30').animate({
			'top': rowFrom * this.cellHeight + 'px',
			'left': colFrom * this.cellWidth + 'px'
		}, this.moveTime, function() {
			self.lisenmove = true;
			$(this).css('z-index', '10');
			self.imgRandArr[from] = self.imgRandArr[to];
			self.imgRandArr[to] = temp;
			if(self.checkPass(self.imgOrigArr, self.imgRandArr)) {
				self.success();
			}
		});
	},
	cellReturn: function(index) {
		var self = this;
		var row = Math.floor(this.imgRandArr[index] / this.levelArr[this.levelNow][1]);
		var col = this.imgRandArr[index] % this.levelArr[this.levelNow][1];
		this.imgCells.eq(index).animate({
			'top': row * this.cellHeight + 'px',
			'left': col * this.cellWidth + 'px'
		}, this.moveTime, function() {
			$(this).css('z-index', '10');
			self.lisenmove = true;
		});
	},
	checkPass: function(rightArr, puzzleArr) {
		if(rightArr.toString() == puzzleArr.toString()) {
			return true;
		}
		return false;
	},
	success: function() {
		var self = this;
		for(var i = 0, len = this.imgOrigArr.length; i < len; i++) {
			if(this.imgCells.eq(i).has('mouseOn')) {
				this.imgCells.eq(i).removeClass('mouseOn');
			}
		}
		this.imgCells.unbind('mousedown').unbind('mouseover').unbind('mouseout');
		this.hasStart = 0;
		$('#choice').removeAttr('disabled');
		//此处游戏成功的代码；
		$('#win-game')[0].style.visibility = 'visible';
		$('#lost-game')[0].style.visibility = 'hidden';
		$("#youdian").text($("select").val());

		clearInterval(self.tt);
		$.ajax({
			type:"post",
			url:"http://api.uubaoku.com/Game/RewardYouDian",
			data:{
				UserId:userId,
				Num:parseFloat($("select").val()),
				GameName:'拼图'
			},
			success:function(){
				console.log('成功了')
			}
		});
	},
	//点击替换功能
	gameevents: function() {
		var self = this;
		//图片替换的点击事件

		$("#right").click(function() {
			if(self.hasStart == 1) {
				return
			};
			var ggg = Math.floor(Math.random() * 10);
			self.img = imgurl[ggg];

			var cells = $(".imgCell");
			for(let i = 0; i < cells.length; i++) {
				cells[i].style.backgroundImage = "url('" + self.img + "')";
				$("#reference-img").attr('src',self.img);
			}



			self.goLink(ggg);

		})
		//遮罩的点击事件
		$("#win-game").on('click', function() {
			$("#win-game").css({
				'visibility': 'hidden'
			})
			self.init();//重置
			$('#choice').removeAttr('disabled');

		});
		$("#lost-game").on('click', function() {
			$("#lost-game").css({
				'visibility': 'hidden'
			})
			self.init();//重置
			$('#choice').removeAttr('disabled');
		});

	},
	//点击跳转
	goLink:function(index){
			var selt = this;

			$("#reference-img").click(function(){
					if (selt.hasStart == 1){
						console.log('您正在游戏中，不方便跳转')
					}else{
					self.location= linkUrl[index];
					}

				});

		}
}
var hhh = $(function() {
		setLocal();
	var pg = new puzzleGame({
		'img': imgurl[0]
	})
});

//console.dir(window.hhh)
//游戏的本地储存 零点归零每日限玩10次
//点击图片替换
