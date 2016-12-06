/**
 * 计划模板组件
 * @author liuqinghu@hikvision.com.cn
 * @date   2014-07-10
 * @update 2014-08-28
 */

;(function($) {
    // 插件名字
    var pluginName = 'planTemplate';

    // 默认配置
    var defaults = {
        type: 'week',
        label: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
        barHeight: 30,      // 拖动条高度
        scaleHeight: 16,    // 刻度高度
        stepWidth: 8 ,      // 最小拖动宽度
        stepMinutes: 15,    // 最小拖动分钟数 
        title: '',          // 标题文字
        addable: false,     // 时间条是否可增加
        sliderColor: 'blue',
        maxSliderNum: 8,
        maxBarNum: 16,
        showButtons: false
    };

    // 周计划配置
    var week_settings = {
        // title: '周计划设置'
    };

    // 假日组配置
    var holiday_settings = {
        // title: '假日组时间列表',
        addable: true,
        label: ['']
    };

    // 门状态配置
    var doorStatus_settings = {
        showButtons: true,
        buttons: [
            {
                text: '常开',
                color: 'blue',
                type: 2
            },
            {
                text: '常关',
                color: 'yellow',
                type: 3
            }

            // {
            //     text: '安全',
            //     color: 'green',
            //     type: 3
            // }
        ]
    };

    // 密码认证配置
    var password_settings = {
        title: '请设置“卡+密码”认证时段',
        buttons: [{type: 2}]
    };

    // 建立全局唯一的索引
    PlanTemplate.index = 0;

    // 计划模板
    function PlanTemplate(element, options) {
        this.$context = element;
        this.settings = null;
        this.$currentSlider = null;
        this.position = null;
        this.time = null;
        this.labelWidth = 80;

        PlanTemplate.index++;

        // 根据type类型选择默认配置
        switch (options.type) {
            case 'week':
                this.settings = $.extend({}, defaults, week_settings, options);
                break;
            case 'holiday':
                this.settings = $.extend({}, defaults, holiday_settings, options);
                break;
            case 'doorStatus':
                this.settings = $.extend({}, defaults, doorStatus_settings, options);
                break;
            case 'password':
                this.settings = $.extend({}, defaults, password_settings, options);
                break;
            default: 
                this.settings = $.extend({}, defaults, options);
                break;
        }

        this.currentColor = this.settings.sliderColor;

        if ($.isArray(this.settings.buttons)) {
            this.hasType = true;
            this.currentType = this.settings.buttons[0].type;
        }

        this.barWidth = this.settings.stepWidth * (60 / this.settings.stepMinutes) * 24;
        this.init();
    }

    PlanTemplate.prototype = {

        // 方法初始化入口
        init: function() {
            this.initData();
            this.createPanel();
            this.createHeader();
            this.setStyle();
            this.paint();
            this.draw();
            this.drag();
            this.click();
            this.hover();
            this.initControl();
            this.cancelSelect();

            if (this.settings.addable) {
                this.initDeleteBtn();
            } else {
                this.copy();
            }
        },

        // 初始化数据，可用于页面加载或者清除数据
        initData: function() {
            var len;

            this.position = [];
            this.time = [];

            if (this.settings.addable && $('.planTemplate-label', this.$context).length > 0) {
                len = $('.planTemplate-label', this.$context).length;
            } else {
                len = this.settings.label.length;
            }

            for (var i  = 0; i < len; i++) {
                this.position.push([]);
                this.time.push([]);
            }
            
        },

        initPanel: function() {
            var that = this;
            $('.planTemplate-control', that.$context).hide();
            // $('.planTemplate-copy-button', that.$context).hide();
            // $('.planTemplate-copy', that.$context).hide();
            $('.planTemplate-slider', that.$context).remove();
            // $('.planTemplate-bar', that.$context).removeClass('planTemplate-bar-current');
            // $('.planTemplate-label', that.$context).removeClass('planTemplate-label-current');
        },

        // 创建主面板
        createPanel: function() {
            var html = [];
            var len = this.settings.label.length;

            html.push('<div class="planTemplate-panel">')

            if (!this.settings.addable) {
                for (var i = 0; i < len; i++) {
                    if (i == 0) {
                        html.push('<div class="planTemplate-scale planTemplate-scale-first"></div>');
                    } else {
                        html.push('<div class="planTemplate-scale"></div>');
                    }
                    html.push('<div class="planTemplate-bar" data-index="' + i +'"></div>',
                              '<div class="planTemplate-label">' + this.settings.label[i] + '</div>');
                }
            }

            html.push('<div class="planTemplate-scale planTemplate-scale-last"></div>');
            html.push('<span class="planTemplate-tips-left"></span>',
                      '<span class="planTemplate-tips-right"></span>');
            html.push('<div class="planTemplate-control">',
                        '<div>',
                          // '<span id="planTemplate-control-startTime'+PlanTemplate.index+'">08:00</span> - ',
                          // '<span id="planTemplate-control-endTime'+PlanTemplate.index+'">09:00</span>',
                          // '<span><input class="planTemplate-control-startTime" id="planTemplate-control-startTime'+PlanTemplate.index+'" type="text" readonly></span><i>-</i>',
                          // '<span><input class="planTemplate-control-endTime" id="planTemplate-control-endTime'+PlanTemplate.index+'" type="text" readonly></span>',
                          '<div class="planTemplate-control-startTime" id="planTemplate-control-startTime'+PlanTemplate.index+'"></div><i>-</i>',
                          '<div class="planTemplate-control-endTime" id="planTemplate-control-endTime'+PlanTemplate.index+'"></div>',
                        '</div>',
                        '<div class="planTemplate-control-action">',
                          '<span class="planTemplate-control-delete">删除</span> <i>|</i> <span class="planTemplate-control-save">保存</span>',
                        '</div>',
                        '<span class="planTemplate-control-close"></span>',
                      '</div>');
            html.push('<div class="planTemplate-time"></div>');
            html.push('</div>');

            this.$context.append($(html.join('')));
            this.$control = $('.planTemplate-control', this.$context);
            this.$tipsLeft = $('span.planTemplate-tips-left', this.$context);
            this.$tipsRight = $('span.planTemplate-tips-right', this.$context);
            this.$time = $('.planTemplate-time', this.$context);
        },

        // 创建头部，包括状态切换，添加，清空，文字标题等
        createHeader: function() {
            var that = this;
            var html = [];
            var $header = null;

            html.push('<div class="planTemplate-header"><ul class="planTemplate-actions"><li class="planTemplate-clear">清空</li></ul></div>');

            $header = $(html.join('')).appendTo(this.$context);

            $header.on('click', '.planTemplate-clear', function() {
                that.initData();
                that.initPanel();
            })

            // 是否显示切换状态按钮
            if (this.settings.showButtons) {
                this.initButtons();
            }

            // 是否显示添加按钮
            if (this.settings.addable) {
                this.initAddBtn();
                $('.planTemplate-add', this.$context).click();
                $('.planTemplate-scale', this.$context).first().addClass('planTemplate-scale-first');
            }

            // 是否显示标题文字
            if (this.settings.title) {
                $header.prepend('<span class="planTemplate-title">' + this.settings.title + '</span>');
            }
        },

        // 创建按钮组
        initButtons: function() {
            var that = this;
            var html = [];
            var buttons = this.settings.buttons;
            var $buttons;

            html.push('<ul class="planTemplate-buttons">')

            for (var i = 0; i < buttons.length; i++) {
              //  html.push('<li data-type="' + buttons[i].type + '" data-color="' + buttons[i].color + '" class="' + buttons[i].color +'">' + buttons[i].text + '</li>')
				html.push('<li data-type="' + buttons[i].type + '" data-color="' + buttons[i].color + '" class="' + buttons[i].color +'"><div>' + buttons[i].text + '</div></li>')
       
            }

            html.push('</ul>')

            $buttons = $(html.join('')).appendTo(this.$context.find('.planTemplate-header'));

            $buttons.on('click', 'li', function() {
                $(this).addClass('selected').siblings().removeClass('selected');
                that.$context.removeClass(that.currentColor);
                that.currentColor = $(this).data('color');
               // that.$context.addClass(that.currentColor);
				that.$context.attr('class','planTemplate '+that.currentColor);//by wangqin 修改了整体的颜色class
                that.currentType = $(this).data('type');
            });

            $buttons.find('li:first').click();
			
			//如果大于8个，需要换行
			if(buttons.length>8){
	            var $panel = $('.planTemplate-panel', that.$context);
	            if(!$panel.hasClass("widthBtn")){
	                $panel.addClass("widthBtn");
	            } 
			}

        },

        // 初始化添加按钮
        initAddBtn: function() {
            var that = this;

            this.$context.find('.planTemplate-actions').prepend('<li class="planTemplate-add">添加</li>');

            this.$context.on('click', '.planTemplate-add', function() {
                if ($('.planTemplate-bar', that.$context).length < that.settings.maxBarNum) {
                    that.addBar();
                } else {
                    hik.util.tip('最多配置16个假日');
                }
            });

        },
        
        // 增加一行
        // TODO 目前增加一行只针对假日计划，不适用其他类型，后期需要的话可以针对不同的类型做处理
        addBar: function() {
            var that = this;
            var html = [];
            var index = $('.planTemplate-bar', this.$context).length;
            var startId = 'planTemplate_label_' + index + '_starttime_' + $.now(); // 创建唯一的id
            var endId = 'planTemplate_label_' + index + '_endtime_' + $.now();
            var $start = null;
            var $end = null;

            html.push('<div class="planTemplate-scale"></div>',
                      '<div class="planTemplate-bar" data-index="' + index +'"></div>',
                      '<div class="planTemplate-label planTemplate-label-date">',
                      // '<input type="text" id="' + startId + '" value="开始时间">',
                      // '<input type="text" id="' + endId + '" value="结束时间">',
                      // '<span><input type="text" id="' + startId + '" value="' + this.getNowTime() + '"></span>',
                      // '<span><input type="text" id="' + endId + '" value="' + this.getNowTime() + '"></span>',
                      '<span><input type="text" readonly id="' + startId + '" value="开始时间"></span>',
                      '<span><input type="text" readonly id="' + endId + '" value="结束时间"></span>',
                      '</div>'
            );

            $('.planTemplate-scale-last', this.$context).before(html.join(''));

            this.setStyle();
            this.position.push([]);
            this.time.push([]);

            // this.$context.on('click', '#' + startId, function() {
            //     var end = $dp.$(endId);
            //     // $(this).val('');

            //     WdatePicker({
            //         readOnly: true,
            //         onpicked: function() {
            //             end.click();
            //             $('#' + endId, that.$context).focus();
            //         }
            //         // maxDate:'#F{$dp.$D(' + endId + ')}'
            //     })
            // });

            // this.$context.on('click', '#' + endId, function() {
            //     // $(this).val('');
            //     WdatePicker({
            //         readOnly: true,
            //         minDate:'#F{$dp.$D(' + startId + ')}'
            //     })
            // });
            
            $start = $('#' + startId, this.$context);
            $end = $('#' + endId, this.$context);
            var startSelectedDate = '';
            var endSelectedDate = '';

            $start.datepicker({
                changeMonth: true,
                changeYear: true,
                minDate: '2001-01-01',
                maxDate: '2099-12-31',
                dateFormat: 'yy-mm-dd',
                beforeShow: function() {
                    if (endSelectedDate != '') {
                        // $start.datepicker( "option", "maxDate", endSelectedDate );
                        $end.val(endSelectedDate);
                    }
                },
                onClose: function( selectedDate ) {
                    startSelectedDate = selectedDate;
                }
            });
            $end.datepicker({
                changeMonth: true,
                changeYear: true,
                minDate: '2001-01-01',
                maxDate: '2099-12-31',
                dateFormat: 'yy-mm-dd',
                beforeShow: function() {
                    if (startSelectedDate != '') {
                        $end.datepicker( "option", "minDate", startSelectedDate );
                        $end.val(startSelectedDate);
                    }
                },
                onClose: function( selectedDate ) {
                    endSelectedDate = selectedDate;
                }
            });

        },

        // 设置主面板里面各个元素的样式
        setStyle: function() {
            var settings = this.settings;

            // 单位高度
            var oneHeight = settings.barHeight + settings.scaleHeight;

            $('.planTemplate-bar', this.$context).each(function(index) {
                $(this).css({
                    // scaleHeight + 1为第一个刻度条的高度
                    top: index * oneHeight + (settings.scaleHeight + 1)
                });

                $(this).data('index', index);
            });

            $('.planTemplate-scale', this.$context).each(function(index) {
                if (index == 0) {
                    $(this).css({
                        top: 0
                    })
                } else {
                    $(this).css({
                        top: index * oneHeight + 1
                    })
                }
            });

            $('.planTemplate-label', this.$context).each(function(index) {
                $(this).css({
                    top: index * oneHeight + (settings.scaleHeight + 1)
                })
            });
        },

        // 验证时间数据是否设置正确
        validData: function(arr) {
            for (var i = 0; i < arr.length; i++) {
                var arr1 = this.sort(arr[i]);
                var arr2 = [];
                for (var j = 0; j < arr1.length; j++) {
                    if (arr1[j].length > 0) {
                        arr2 = arr2.concat(arr1[j][0], arr1[j][1]);
                    }
                }

                var arr3 = $.extend(true, [], arr2);
                arr3.sort(function(x, y) {
                    return x - y;
                })

                for (var k = 0; k < arr3.length; k++) {
                    // 看排序前后的数组元素是否都相等，不相等说明原来的数组时间设置有误
                    if (arr2[k] !== arr3[k]) {
                        hik.libs.say('时间设置有误，请重新设置', 'error');
                        return false;
                    }
                }
            }

            return true;
        },


        // 供外部的调用的验证方法，只针对有添加功能的计划模板
        isValid: function() {
            // 常规计划模板的时间验证
            if (!this.settings.addable) {
                return this.validData(this.time);
            }

            // 假日组的额外验证，包括日期验证等
            if (!this.validData(this.time)) {
                return false;
            }

            var that = this;
            var date = [];
            var sortedDate = null;
            var errorInfo = '';
            var len;

            // 验证开始时间是否设置
            $('.planTemplate-label', that.$context).each(function(index) {
                var $input = $(this).find('input');
                var startTime = $input.eq(0).val().replace(/-/g, '/');
                var endTime = $input.eq(1).val().replace(/-/g, '/');

                if (startTime == '开始时间' || startTime == '' || endTime == '结束时间' || endTime == '') {
                    errorInfo += '第' + (index + 1) + '个假日的开始时间或结束时间未设置<br>';
                } else {
                    date.push([new Date(startTime).getTime(), new Date(endTime).getTime()]);
                }
                
            });

            if (errorInfo != '') {
                hik.util.tip(errorInfo);
                return false;
            }

            // 验证开始时间是否小于结束时间
            $.each(date, function(index, element) {
                if (element[0] > element[1]) {
                    errorInfo += '第' + (index + 1) + '个假日的开始时间不能大于结束时间';
                }
            })

            if (errorInfo != '') {
                hik.util.tip(errorInfo);
                return false;
            }

            // 验证各个假日时间是否有冲突
            sortedDate = that.sort(date);
            len = sortedDate.length;

            if (len > 1) {
                $.each(date, function(index, element) {
                    if (errorInfo != '') {
                        return;
                    }

                    for (var i = 0; i < len; i++) {
                        if (element[0] == sortedDate[i][0] && element[1] == sortedDate[i][1]) {
                            if (i == 0) {
                                if (sortedDate[i][1] >= sortedDate[i + 1][0]) {
                                    errorInfo += '第' + (index + 1) + '个假日的时间设置有冲突';
                                    break;
                                }
                            } else if (i == len - 1) {
                                if (sortedDate[i][0] <= sortedDate[i - 1][1]) {
                                    errorInfo += '第' + (index + 1) + '个假日的时间设置有冲突';
                                    break;
                                }
                            } else {
                                if (sortedDate[i][0] <= sortedDate[i - 1][1] || sortedDate[i][1] >= sortedDate[i + 1][0]) {
                                    errorInfo += '第' + (index + 1) + '个假日的时间设置有冲突';
                                    break;
                                }
                            }
                        }
                    }
                })
            }

            if (errorInfo != '') {
                hik.util.tip(errorInfo);
                return false;
            }
            
            return true;
        },

        getData: function() {
            var data = [];
            var date = [];
            var i;
            var j;
            var temp = $.extend(true, [], this.time);

            // for (i = 0; i < temp.length; i++) {
            //     for (j = 0; j < temp[i].length; j++) {
            //         temp[i][j][1] = temp[i][j][1] - 1;
            //     }
            // }

            // this.positionToTime();
            for (i = 0; i < temp.length; i++) {
                if (temp[i].length > 0) {
                    data.push(temp[i].join(';') + ';');
                } else {
                    data.push('');
                }
            }

            if (this.settings.addable) {
                $('.planTemplate-label', this.$context).each(function(index) {
                    var $input = $(this).find('input');
                    var startTime = $input.eq(0).val();
                    var endTime = $input.eq(1).val();
                    date.push(startTime + ',' + endTime);
                })

                return {
                    date: date,
                    plan: data
                }
            } else {
                return data;
            }
        },

        // 供外部调用的设置数据接口
        setData: function(dataObj) {
            if (!dataObj) {
                return;
            }

            var data;

            if (this.settings.addable) {
                data = dataObj.plan;

                for (var i = 0; i < data.length - 1; i++) {
                    this.addBar();
                }

                $('.planTemplate-label', this.$context).each(function(index) {
                    var dateArr = dataObj.date[index].split(',')
                    $(this).find('input').eq(0).val(dateArr[0]);
                    $(this).find('input').eq(1).val(dateArr[1]);
                })

            } else {
                data = dataObj;
            }

            this.initPanel();
            this.time = [];
            this.position = [];

            for (var i = 0; i < data.length; i++) {
                this.time.push(this.timeStrToArr(data[i]));
            }
            this.timeToPosition();

            this.render(this.position);

            // var data = this.timeStrToArr("3600,13500;18000,29700;34200,45000;");
        },

        // 把时间数组转换为位置数组
        timeToPosition: function() {
            var i, j, k;
            var arr = $.extend(true, [], this.time);
            var stepMinutes = this.settings.stepMinutes;
            var stepWidth = this.settings.stepWidth;

            if (this.hasType) {
                for (i = 0; i < arr.length; i++) {
                    for (j = 0; j < arr[i].length; j++) {
                        arr[i][j][0] = Math.floor((arr[i][j][0] * stepWidth) / (stepMinutes * 60));
                        arr[i][j][1] = Math.ceil((arr[i][j][1] * stepWidth) / (stepMinutes * 60));
                        arr[i][j][2] = arr[i][j][2];
                    }
                }
            } else {
                for (i = 0; i < arr.length; i++) {
                    for (j = 0; j < arr[i].length; j++) {
                        arr[i][j][0] = Math.floor((arr[i][j][0] * stepWidth) / (stepMinutes * 60));
                        arr[i][j][1] = Math.ceil((arr[i][j][1] * stepWidth) / (stepMinutes * 60));
                    }
                }
            }

            this.position = arr;
        },

        // 把位置数组转换为时间数组，只适用于没有精确调整的情形
        // 注意：已经废弃 2014-08-03 by lqh
        positionToTime: function() {
            var i, j, k;
            var arr = $.extend(true, [], this.position);
            var stepMinutes = this.settings.stepMinutes;
            var stepWidth = this.settings.stepWidth;

            if (this.hasType) {
                for (i = 0; i < arr.length; i++) {
                    for (j = 0; j < arr[i].length; j++) {
                        arr[i][j][0] = (arr[i][j][0] / stepWidth) * stepMinutes * 60;
                        arr[i][j][1] = (arr[i][j][1] / stepWidth) * stepMinutes * 60;
                        arr[i][j][2] = arr[i][j][2];
                    }
                }
            } else {
                for (i = 0; i < arr.length; i++) {
                    for (j = 0; j < arr[i].length; j++) {
                        for (k = 0; k < arr[i][j].length; k++) {
                            arr[i][j][k] = (arr[i][j][k] / stepWidth) * stepMinutes * 60;
                        }
                    }
                }
            }

            this.time = arr;

        },

        // 数据渲染引擎
        render: function(pos) {
            var $bar = $('.planTemplate-bar', this.$context);
            var html = [];
            var color = '';

            if (this.hasType) {
                for (var i = 0; i < pos.length; i++) {
                    html = [];
                    for (var j = 0; j < pos[i].length; j++) {
                       // color = pos[i][j][2] == 2 ? 'blue' : 'yellow';
						color = this.getColor(pos[i][j][2]);
                        html.push('<div class="planTemplate-slider planTemplate-slider-created ' + color + '" style="width:' + (pos[i][j][1] - pos[i][j][0]) + 'px; left:' + pos[i][j][0] +'px;">',
                                    '<i class="planTemplate-slider-left"></i>',
                                    '<i class="planTemplate-slider-right"></i>',
                                '</div>')
                    }
                    $bar.eq(i).append(html.join(''));
                }
            } else {
                for (var i = 0; i < pos.length; i++) {
                    html = [];
                    for (var j = 0; j < pos[i].length; j++) {
                        html.push('<div class="planTemplate-slider planTemplate-slider-created blue" style="width:' + (pos[i][j][1] - pos[i][j][0]) + 'px; left:' + pos[i][j][0] +'px;">',
                                    '<i class="planTemplate-slider-left"></i>',
                                    '<i class="planTemplate-slider-right"></i>',
                                '</div>')
                    }
                    $bar.eq(i).append(html.join(''));
                }
            }
            
        },
       // 获取颜色
        getColor: function(num) {
            var buttons = this.settings.buttons;
            for(var i=0; i<buttons.length;i++){
                var button = buttons[i];
                if(button.type == num){
                    return button.color || "blue";//by wangqin 默认为blue颜色
                }
            }
        },
        // 把一组时间字符串转化为数组
        timeStrToArr: function(str) {
            if (!str) {
                return [];
            }
            var a = str.split(";");
            var b = [];
            for(var i=0; i<a.length;i++){
                if(a[i]){
                    var c = a[i].split(",");
                    var d = [];
                    for(var j=0; j<c.length; j++){
                        // if(j == 1){
                        //     d.push(parseInt(c[j]) + 1);
                        // } else {
                        //     d.push(parseInt(c[j]));
                        // }
                        if(c[j]){
                            d.push(+c[j]);
                        }
                    }
                    b.push(d);
                }
            }
            return b;
        },

        updateData: function(barIndex, sliderIndex, begin, end) {
            var stepWidth = this.settings.stepWidth;

            if (this.hasType) {
                this.position[barIndex][sliderIndex] = [begin, end, this.position[barIndex][sliderIndex][2]];
            } else {
                this.position[barIndex][sliderIndex] = [begin, end];
            }
        },

        updateTime: function(barIndex, sliderIndex, begin, end, oldBegin, oldEnd) {
            var stepWidth = this.settings.stepWidth;
            var oldStartTime = this.time[barIndex][sliderIndex][0];
            var oldEndTime = this.time[barIndex][sliderIndex][1];
            var x = (begin - oldBegin) / stepWidth * 15 * 60;
            var y = (end - oldEnd) / stepWidth * 15 * 60;
            var startTime = oldStartTime + x;
            var endTime = oldEndTime + y;

            if (this.hasType) {
                this.time[barIndex][sliderIndex] = [startTime, endTime, this.time[barIndex][sliderIndex][2]];
            } else {
                this.time[barIndex][sliderIndex] = [startTime, endTime];
            }
        },

        insertData: function(barIndex, begin, end) {
            var stepWidth = this.settings.stepWidth;
            var startTime = (begin / stepWidth) * 15 * 60;
            var endTime = (end / stepWidth) * 15 * 60;

            if (this.hasType) {
                this.position[barIndex].push([begin, end, this.currentType]);
                this.time[barIndex].push([startTime, endTime, this.currentType]);
            } else {
                this.position[barIndex].push([begin, end]);
                this.time[barIndex].push([startTime, endTime]);
            }
        },

        sort: function(array) {
            var temp = $.extend(true, [], array);

            temp.sort(function(x, y) {
                return x[0] - y[0];
            });

            return temp;
        },

        getArea: function(array, position) {
            var arr = null;
            var min = 0;
            var max = this.barWidth;
            var availableArea = [];

            arr = this.sort(array);

            arr.unshift([min, min]);
            arr.push([max, max]);

            if ($.isArray(position)) {
                for (var i = 1; i < arr.length; i++) {
                    if (arr[i][0] == position[0]) {
                        availableArea.push(arr[i - 1][1], arr[i + 1][0]);
                        return availableArea;
                    }
                }
            } else {
                for (var i = 0; i < arr.length - 1; i++) {
                    if (position >= arr[i][1] && position <= arr[i + 1][0]) {
                        availableArea.push(arr[i][1], arr[i + 1][0]);
                        return availableArea;
                    }
                }
            }

            if (availableArea.length == 0) {
                console.log('出错了！');
                return [0, 0];
            }
        },

        // IE下取消文字选中，不然拖拽效果受影响，其他浏览器通过css进行设置
        cancelSelect: function() {
            var $dialog = this.$context.parents('.ui-dialog');
            this.$context[0].onselectstart = function() {
                return false;
            };
            if ($dialog.length > 0) {
                $dialog[0].onselectstart = function() {
                    return false;
                };
                $dialog.addClass('planTemplate-dialog');
            }
        },

        getNowTime: function() {
            var now = new Date();
            var year = now.getFullYear();
            var month;
            var day;

            month = now.getMonth();
            month = this.formatNum(month + 1);
            day = this.formatNum(now.getDate());

            return year + '-' + month + '-' + day;

        },

        paint: function() {
            var that = this;
            var startPageX = 0;     // mousedown的pageX
            var $slider = null;     // 当前paint动作的slide元素
            var left = 0;           // 距离父元素的left值
            var rMaxWidth = 0;      // 向右的最大宽度
            var lMaxWidth = 0;      // 向左的最大宽度
            var minWidth = this.settings.stepWidth;
            var barWidth = this.barWidth;
            var $parent = null;

            // mousedown的时候生成slide元素，绑定document的mousemove和mouseup事件
            var mousedownEvent = function(e) {
                var $this = $(this);
                var remainder = 0; // 余数
                var availableArea = null;
                var barIndex;

                // 限制slider的数量
                if ($this.find('.planTemplate-slider').length >= that.settings.maxSliderNum) {
                    return;
                }

                // 生成当前slider元素
                $slider = $('<div class="planTemplate-slider ' + that.currentColor 
                        + '"><i class="planTemplate-slider-left"></i><i class="planTemplate-slider-right"></i></div>')
                        .appendTo($this);

                startPageX = e.pageX;

                // 这里的-1为bar的1像素边框
                left = startPageX - $this.offset().left - 1;
                remainder = left % minWidth;

                // 求整
                left = left - remainder;
                // startPageX = startPageX - remainder;

                $parent = $slider.parent();

                // 当前slider所在的行索引值
                barIndex = $parent.data('index');

                // 获取可以进行拖拽的区域
                availableArea = that.getArea(that.position[barIndex], left);
                
                rMaxWidth = availableArea[1] - left;
                lMaxWidth = left - availableArea[0] + minWidth;

                $(document).on('mousemove.slider', mousemoveEvent);
                $(document).on('mouseup.slider', mouseupEvent);

                // return false;
                e.stopPropagation();

                // 移除其他slider的选中状态
                if (that.$currentSlider) {
                    that.$currentSlider.children().hide();
                    that.$currentSlider.removeClass('planTemplate-slider-current');
                    // $('.planTemplate-copy-button', that.$context).hide();
                    // $('.planTemplate-copy', that.$context).hide();
                    that.$currentSlider = null;
                    that.$control.hide();
                }

                e.stopPropagation();

                
            };

            var mousemoveEvent = function(e) {
                var width = 0;

                // 判断正向拖动还是反向拖动
                if (e.pageX >= startPageX) {
                    width = e.pageX - startPageX;
                    width = Math.ceil(width / minWidth) * minWidth;
                    width = width < rMaxWidth ? width : rMaxWidth;
                    $slider.width(width);
                    $slider.css({
                        left: left
                    });
                    if (width > 0) {
                        that.showTips(left, width, $parent);
                    }
                } else {
                    width = startPageX - e.pageX;
                    width = Math.ceil(width / minWidth) * minWidth;
                    width = width < lMaxWidth ? width : lMaxWidth
                    $slider.width(width);
                    $slider.css({
                        left: left + minWidth - width
                    });
                    if (width > 0) {
                        that.showTips(left + minWidth - width, width, $parent, true);
                    }
                }
            };

            var mouseupEvent = function() {
                var barIndex = 0;
                var begin = 0;
                var end = 0;

                if ($slider.width() == 0) {
                    $slider.remove();
                } else {

                    // 当前索引
                    barIndex = $parent.data('index');
                    begin = parseInt($slider.css('left'));
                    end = begin + $slider.width();

                    that.insertData(barIndex, begin, end);
                }

                $slider.addClass('planTemplate-slider-created');

                that.$tipsLeft.hide();
                that.$tipsRight.hide();

                $(document).off('mousemove.slider');
                $(document).off('mouseup.slider');

            };

            this.$context.on('mousedown', '.planTemplate-bar', mousedownEvent);
        },

        // 整块拖动
        drag: function() {
            var that = this;
            var startPageX = 0;
            var $slider = null;     // 当前paint动作的slide元素
            var left = 0;           // 距离父元素的left值
            var rMaxLength = 0;     // 向右的最大拖动距离
            var lMaxLength = 0;     // 向左的最大拖动距离
            var minWidth = this.settings.stepWidth;
            var barWidth = this.barWidth;
            var barIndex = 0;
            var sliderWidth = 0;
            var $control = this.$control;
            var $parent = null;

            var mousedownEvent = function(e) {
                var currentPos;
                var availableArea;

                $slider = $(this);
                left = parseInt($slider.css('left'));
                startPageX = e.pageX;

                // lMaxLength = left;
                // rMaxLength = barWidth - left - $slider.width();

                // 当前slider所在的行索引值
                $parent = $slider.parent();
                barIndex = $parent.data('index');
                currentPos = that.position[barIndex];
                sliderWidth = $slider.width();
                availableArea = that.getArea(currentPos, [left, left + sliderWidth]);
                lMaxLength = left - availableArea[0];
                rMaxLength = availableArea[1] - left - sliderWidth;

                $control.hide();

                $(document).on('mousemove.drag', mousemoveEvent);
                $(document).on('mouseup.drag', mouseupEvent);
                e.stopPropagation();
            };

            var mousemoveEvent = function(e) {
                var length = e.pageX - startPageX;

                length = Math.floor(length / minWidth) * minWidth;
                if (length > rMaxLength) {
                    length = rMaxLength
                } else if ((-length) > lMaxLength) {
                    length = -lMaxLength;
                }
                $slider.css({
                    left: left + length
                });

                if (length !== 0) {
                    that.showTips(left + length, sliderWidth, $parent);
                }

            };

            var mouseupEvent = function(e) {
                var begin = parseInt($slider.css('left'));

                that.updateData(barIndex, $slider.index(), begin, begin + sliderWidth);
                that.updateTime(barIndex, $slider.index(), begin, begin + sliderWidth, left, left + sliderWidth);

                that.showControl($slider);
                that.$time.hide();

                that.$tipsLeft.hide();
                that.$tipsRight.hide();

                $(document).off('mousemove.drag');
                $(document).off('mouseup.drag');
            };

            this.$context.on('mousedown', '.planTemplate-slider', mousedownEvent);
        },

        // 左右伸缩
        draw: function() {
            var that = this;
            var startPageX = 0;
            var $slider = null;     // 当前paint动作的slide元素
            var left = 0;           // 距离父元素的left值
            var rMaxLength = 0;     // 向右的最大拖动距离
            var lMaxLength = 0;     // 向左的最大拖动距离
            var minWidth = this.settings.stepWidth;
            var barWidth = this.barWidth;
            var barIndex = 0;
            var sliderWidth = 0;
            var $control = this.$control;
            var $parent = null;

            var mousedownEventRight = function(e) {
                if (!that.$currentSlider) {
                    return;
                }

                var currentPos;
                var availableArea;

                $slider = $(this).parent();
                $slider.addClass('planTemplate-slider-draw');
                left = parseInt($slider.css('left'));
                startPageX = e.pageX;

                $parent = $slider.parent();

                // 当前slider所在的行索引值
                barIndex = $slider.parent().data('index');

                // 当前所在的bar的slider位置数组信息
                currentPos = that.position[barIndex];
                sliderWidth = $slider.width();

                // 可用的位置区间
                availableArea = that.getArea(currentPos, [left, left + sliderWidth]);

                // 向左的最大长度
                lMaxLength = sliderWidth - minWidth;

                // 向右的最大长度
                rMaxLength = availableArea[1] - left - sliderWidth;

                $(document).on('mousemove.draw', mousemoveEventRight);
                $(document).on('mouseup.draw', mouseupEventRight);

                e.stopPropagation();

                $control.hide();
            };

            var mousemoveEventRight = function(e) {
                var length = e.pageX - startPageX;

                length = Math.ceil(length / minWidth) * minWidth;
                if (length > rMaxLength) {
                    length = rMaxLength;
                } else if ((-length) > lMaxLength) {
                    length = -lMaxLength;
                }

                $slider.width(sliderWidth + length);
                // $slider.css({
                //     left: left + length
                // });
                
                if (length !== 0) {
                    that.showTips(left, sliderWidth + length, $parent);
                }

                e.stopPropagation();
            };

            var mouseupEventRight = function(e) {
                var begin = parseInt($slider.css('left'));

                that.updateData(barIndex, $slider.index(), begin, begin + $slider.width());
                that.updateTime(barIndex, $slider.index(), begin, begin + $slider.width(), left, left + sliderWidth);

                $slider.removeClass('planTemplate-slider-draw');

                that.showControl($slider);
                that.$time.hide();

                that.$tipsLeft.hide();
                that.$tipsRight.hide();

                $(document).off('mousemove.draw');
                $(document).off('mouseup.draw');

                e.stopPropagation();
            };

            var mousedownEventLeft = function(e) {
                if (!that.$currentSlider) {
                    return;
                }

                var currentPos;
                var availableArea;

                $slider = $(this).parent();
                $slider.addClass('planTemplate-slider-draw');
                left = parseInt($slider.css('left'));
                startPageX = e.pageX;

                $parent = $slider.parent();

                // 当前slider所在的行索引值
                barIndex = $slider.parent().data('index');

                // 当前所在的bar的slider位置数组信息
                currentPos = that.position[barIndex];
                sliderWidth = $slider.width();

                // 可用的位置区间
                availableArea = that.getArea(currentPos, [left, left + sliderWidth]);

                // 向左的最大长度
                lMaxLength = left - availableArea[0];

                // 向右的最大长度
                rMaxLength = sliderWidth - minWidth;

                $(document).on('mousemove.draw', mousemoveEventLeft);
                $(document).on('mouseup.draw', mouseupEventLeft);

                e.stopPropagation();

                $control.hide();
            };

            var mousemoveEventLeft = function(e) {
                var length = e.pageX - startPageX;

                length = Math.floor(length / minWidth) * minWidth;
                if (length > rMaxLength) {
                    length = rMaxLength;
                } else if ((-length) > lMaxLength) {
                    length = -lMaxLength;
                }

                $slider.width(sliderWidth - length);
                $slider.css({
                    left: left + length
                });

                e.stopPropagation();

                if (length !== 0) {
                    that.showTips(left + length, sliderWidth - length, $parent);
                }
            };

            var mouseupEventLeft = function(e) {
                var begin = parseInt($slider.css('left'));

                that.updateData(barIndex, $slider.index(), begin, begin + $slider.width());
                that.updateTime(barIndex, $slider.index(), begin, begin + $slider.width(), left, left + sliderWidth);

                $slider.removeClass('planTemplate-slider-draw');

                that.showControl($slider);
                that.$time.hide();

                that.$tipsLeft.hide();
                that.$tipsRight.hide();

                $(document).off('mousemove.draw');
                $(document).off('mouseup.draw');

                e.stopPropagation();
            };

            this.$context.on('mousedown', '.planTemplate-slider-right', mousedownEventRight);
            this.$context.on('mousedown', '.planTemplate-slider-left', mousedownEventLeft);
        },

        click: function() {
            var that = this;

            var mousedownEvent = function(e) {
                var $this = $(this);

                if (that.$currentSlider) {
                    that.$currentSlider.children().hide();
                    that.$currentSlider.removeClass('planTemplate-slider-current');
                    // $('.planTemplate-copy-button', that.$context).hide();
                    // $('.planTemplate-copy', that.$context).hide();
                }
                $this.addClass('planTemplate-slider-current');
                $this.children().show();

                // $('.planTemplate-copy-button', that.$context).css({
                //     top: $this.parent().css('top')
                // }).show();

                // $('.planTemplate-copy').css({
                //     top: parseInt($this.parent().css('top')) - 64
                // });

                that.$currentSlider = $this;

                e.stopPropagation();
            }

            that.$context.on('mousedown.click', '.planTemplate-slider', mousedownEvent);
            
        },

        hover: function() {
            var that = this;
            var $time = $('.planTemplate-time', this.$context);

            this.$context.on('mouseenter', '.planTemplate-slider-created', function() {
                var $this = $(this);
                var $parent = $this.parent();
                var barIndex = $parent.data('index');
                var sliderIndex = $this.index();
                var labelWidth = that.labelWidth;
                var begin = that.position[barIndex][sliderIndex][0];
                var end = that.position[barIndex][sliderIndex][1];
                var timeObj = that.formatTime(that.time[barIndex][sliderIndex][0], that.time[barIndex][sliderIndex][1]);
                
                $time.text(timeObj.beginHours + ':' + timeObj.beginMinutes + ' - ' + timeObj.endHours + ':' + timeObj.endMinutes);

                $time.css({
                    left: labelWidth + begin + (end - begin) / 2 - $time.outerWidth() / 2,
                    top: parseInt($parent.css('top')) - $this.outerHeight() - 13
                }).show();
            });

            this.$context.on('mouseleave', '.planTemplate-slider', function() {
                $time.hide();
            });

        },

        // getTipsPos: function($slider, $tips, barIndex, sliderIndex) {
        //     var $parent = $slider.parent();
        //     var labelWidth = $('.planTemplate-label', this.$context).outerWidth();
        //     var begin = this.position[barIndex][sliderIndex][0];
        //     var end = this.position[barIndex][sliderIndex][1];

        //     return {
        //         left: labelWidth + begin + (end - begin) / 2 - $tips.outerWidth() / 2,
        //         top: parseInt($parent.css('top')) - $slider.outerHeight() - 13
        //     }
        // },

        // formatTime: function(barIndex, sliderIndex) {
        //     var beginTime = this.time[barIndex][sliderIndex][0];
        //     var endTime = this.time[barIndex][sliderIndex][1];
        //     var beginHours = this.formatNum(Math.floor(beginTime / 3600));
        //     var beginMinutes = this.formatNum(Math.floor((beginTime - beginHours * 3600) / 60));
        //     var endHours = this.formatNum(Math.floor(endTime / 3600));
        //     var endMinutes = this.formatNum(Math.floor((endTime - endHours * 3600) / 60));

        //     return {
        //         beginHours: beginHours,
        //         beginMinutes: beginMinutes,
        //         endHours: endHours,
        //         endMinutes: endMinutes
        //     }
        // },

        formatTime: function(beginTime, endTime) {
            var beginHours = this.formatNum(Math.floor(beginTime / 3600));
            var beginMinutes = this.formatNum(Math.floor((beginTime - beginHours * 3600) / 60));
            var endHours = this.formatNum(Math.floor(endTime / 3600));
            var endMinutes = this.formatNum(Math.floor((endTime - endHours * 3600) / 60));

            return {
                beginHours: beginHours,
                beginMinutes: beginMinutes,
                endHours: endHours,
                endMinutes: endMinutes
            }
        },

        formatNum: function(num) {
            return num < 10 ? '0' + num : num;
        },

        showTips: function(left, width, $parent, reverse) {
            var that = this;
            var top = parseInt($parent.css('top')) - that.$tipsLeft.outerHeight();
            var stepWidth = this.settings.stepWidth;
            var startTime = (left / stepWidth) * 15 * 60;
            var endTime = ((left + width) / stepWidth) * 15 * 60;
            var timeObj = that.formatTime(startTime, endTime);
            that.$time.hide();

            that.$tipsLeft.css({
                left: left + that.labelWidth - 17,
                top: top
            });

            that.$tipsRight.css({
                left: left + width + that.labelWidth - 18,
                top: top
            })

            that.$tipsLeft.text(timeObj.beginHours + ':' + timeObj.beginMinutes).show();
            that.$tipsRight.text(timeObj.endHours + ':' + timeObj.endMinutes).show();

        },

        showControl: function($slider) {
            var that = this;
            var $this = $slider;
            var $parent = $this.parent();
            var barIndex = $parent.data('index');
            var sliderIndex = $this.index();
            var timeObj = that.formatTime(that.time[barIndex][sliderIndex][0], that.time[barIndex][sliderIndex][1]);
            var begin = that.position[barIndex][sliderIndex][0];
            var end = that.position[barIndex][sliderIndex][1];
            var beginTime = that.time[barIndex][sliderIndex][0];
            var endTime = that.time[barIndex][sliderIndex][1];
            // endTime = endTime == 24 * 3600 ? endTime - 1 : endTime;
            var $control = this.$control;
            var $start = $control.find('.planTemplate-control-startTime');
            var $end = $control.find('.planTemplate-control-endTime');
            var beginHours = that.formatNum(Math.floor(beginTime/3600));
            var beginMinutes = that.formatNum(Math.floor((beginTime%3600)/60))
            var endHours = that.formatNum(Math.floor(endTime/3600));
            var endMinutes = that.formatNum(Math.floor((endTime%3600)/60));

            if (!that.dialogInited) {
                that.$context.parents('.ui-dialog-content').css('overflow', 'visible');
                that.$context.parents('.ui-dialog').css('overflow', 'visible');
                that.dialogInited = true;
            }

            $control.css({
                left: that.labelWidth + begin + (end - begin) / 2 - $control.outerWidth() / 2,
                top: parseInt($parent.css('top')) - $control.outerHeight()
            });

            // $start.val(beginHours + ':' + beginMinutes);
            // $end.val(endHours + ':' + endMinutes);

            that.startTime.setValue(beginHours + ':' + beginMinutes + ':00');
            that.endTime.setValue(endHours + ':' + endMinutes + ':00');

            $control.show();
        },

        initControl: function() {
            var that = this;
            var $control = this.$control;
            var startId = 'planTemplate-control-startTime' + PlanTemplate.index;
            var endId = 'planTemplate-control-endTime' + PlanTemplate.index;
            var $start = $('#' + startId, that.$context);
            var $end = $('#' + endId, that.$context);
            // $('#' + startId).click(function() {
            //     WdatePicker({
            //         el: startId,
            //         dateFmt:'HH:mm',
            //         isShowClear: false,
            //         isShowOK: true,
            //         isShowToday: false
            //         // minDate:'8:00',
            //         // maxDate:'11:30'
            //     });
            // });

            // $('#' + endId).click(function() {
            //     WdatePicker({
            //         el: endId,
            //         dateFmt:'HH:mm',
            //         isShowClear: false,
            //         isShowOK: true,
            //         isShowToday: false
            //     })
            // });

            // $start.timepicker({
            //     showClear: false
            // });
            // $end.timepicker({
            //     showClear: false
            // });

            that.startTime = {}
            $(".tsecond", $start).hide();
            $(".tm", $start).eq(1).hide();

            that.endTime ={}
            $(".tsecond", $end).hide();
            $(".tm", $end).eq(1).hide();

            this.$context.on('click', '.planTemplate-control-close', function() {
                $control.hide();
            });

            this.$context.on('click', '.planTemplate-control-delete', function() {
                var sliderIndex = that.$currentSlider.index();
                var barIndex = that.$currentSlider.parent().data('index');

                // $('.planTemplate-copy-button', that.$context).hide();

                that.position[barIndex].splice(sliderIndex, 1);
                that.time[barIndex].splice(sliderIndex, 1);

                that.$currentSlider.remove();
                $control.hide();

            });

            this.$context.on('click', '.planTemplate-control-save', function() {
                var $slider = that.$currentSlider;
                var sliderIndex = $slider.index();
                var barIndex = $slider.parent().data('index');
                var availableArea;
                // var beginTime = $start.val().split(':');
                // var endTime = $end.val().split(':');

                var beginTime = that.startTime.getValue().split(':');
                var endTime = that.endTime.getValue().split(':');

                beginTime = parseInt(beginTime[0], 10) * 3600 + parseInt(beginTime[1], 10) * 60;
                endTime = parseInt(endTime[0], 10) * 3600 + parseInt(endTime[1], 10) * 60;

                availableArea = that.getTimeArea(that.time[barIndex], that.time[barIndex][sliderIndex][0]);

                if (beginTime < availableArea[0] || endTime > availableArea[1] || beginTime >= endTime) {
                    hik.util.tip('时间设置有误，请重新设置');
                } else {
                    that.position[barIndex][sliderIndex][0] = Math.floor(beginTime * 8 / 15 / 60);
                    that.position[barIndex][sliderIndex][1] = Math.ceil(endTime * 8 / 15 / 60);

                    that.time[barIndex][sliderIndex][0] = beginTime;
                    that.time[barIndex][sliderIndex][1] = endTime;

                    $slider.css({
                        left: that.position[barIndex][sliderIndex][0],
                        width: that.position[barIndex][sliderIndex][1] - that.position[barIndex][sliderIndex][0]
                    })

                    $control.hide();
                }
                
            });

            this.$context.on('dblclick.control', '.planTemplate-slider', function() {
                // that.showControl($(this));
                // that.$time.hide();
            });
        },

        getTimeArea: function(barTime, beginTime) {
            var arr = null;
            var min = 0;
            var max = 24 * 60 * 60;
            var availableArea = [];

            arr = this.sort(barTime);

            arr.unshift([min, min]);
            arr.push([max, max]);

            for (var i = 1; i < arr.length; i++) {
                if (arr[i][0] == beginTime) {
                    availableArea.push(arr[i - 1][1], arr[i + 1][0]);
                    return availableArea;
                }
            }

            if (availableArea.length == 0) {
                console.log('出错了！');
            }
        },

        initEvents: function($btn, $copy) {
            var that = this;
            var $currentBar = null;
            var $currentLabel = null;
            // var index = 0;

            var mouseenterEvent = function() {
                var $this = $(this);
                var index = 0;

                if ($this.hasClass('planTemplate-bar')) {
                    $btn.data('index', $this.data('index'));
                } else if ($this.hasClass('planTemplate-label')) {
                    $btn.data('index', $this.prev('.planTemplate-bar').data('index'));
                }

                index = $btn.data('index');

                $currentBar = $('.planTemplate-bar', that.$context).eq(index);
                $currentLabel = $('.planTemplate-label', that.$context).eq(index);

                $btn.css({
                    top: $currentBar.css('top')
                }).show();

                $currentBar.addClass('planTemplate-bar-current');
                $currentLabel.addClass('planTemplate-label-current');
            };

            var mouseleaveEvent = function() {
                $btn.hide();
                $currentBar.removeClass('planTemplate-bar-current');
                $currentLabel.removeClass('planTemplate-label-current');
                if ($copy && $copy.length > 0) {
                    $copy.hide();
                }
            };

            that.$context.on('mouseenter', '.planTemplate-bar', mouseenterEvent);
            that.$context.on('mouseenter', '.planTemplate-label', mouseenterEvent);
            $btn.on('mouseenter', mouseenterEvent);

            that.$context.on('mouseleave', '.planTemplate-bar', mouseleaveEvent);
            that.$context.on('mouseleave', '.planTemplate-label', mouseleaveEvent);
            $btn.on('mouseleave', mouseleaveEvent);

            if ($copy && $copy.length > 0) {
                $copy.on('mouseenter', mouseenterEvent);
                $copy.on('mouseleave', mouseleaveEvent);
            }
        },

        // 初始化删除按钮
        initDeleteBtn: function() {
            var that = this;
            var $deleteBtn = $('<span class="planTemplate-delete"></span>').appendTo($('.planTemplate-panel', this.$context));
            var $current = null

            // this.$context.on('mouseenter', '.planTemplate-bar', function() {
            //     var $this = $(this);
            //     index = $this.data('index');

            //     $current = $this;

            //     $deleteBtn.css({
            //         top: $this.css('top')
            //     }).show();

            //     $this.addClass('planTemplate-bar-current');
            //     $('.planTemplate-label', that.$context).eq(index).addClass('planTemplate-label-current');
            // })

            // this.$context.on('mouseleave', '.planTemplate-bar', function() {
            //     var $this = $(this);
            //     $deleteBtn.hide();
            //     $this.removeClass('planTemplate-bar-current');
            //     $('.planTemplate-label', that.$context).eq(index).removeClass('planTemplate-label-current');
            // })

            // $deleteBtn.on('mouseenter', function() {
            //     // $deleteBtn.show();
            //     $current.mouseenter();
            // })

            // $deleteBtn.on('mouseleave', function() {
            //     // $deleteBtn.hide();
            //     $current.mouseleave();
            // })

            that.initEvents($('.planTemplate-delete', that.$context));

            this.$context.on('click', '.planTemplate-delete', function() {
                var index = $deleteBtn.data('index');

                if ($('.planTemplate-bar', that.$context).length > 1) {
                    $(this).hide();
                    $('.planTemplate-label', that.$context).eq(index).remove();
                    $('.planTemplate-bar', that.$context).eq(index).remove();
                    if (index == 0) {
                        $('.planTemplate-scale', that.$context).eq(index + 1).remove();
                    } else {
                        $('.planTemplate-scale', that.$context).eq(index).remove();
                    }
                    that.setStyle();

                    that.position.splice(index, 1);
                    that.time.splice(index, 1);
                } else {
                    hik.util.tip('最后一个假日不能删除！')
                }
            })

        },

        copy: function() {
            var that = this;
            var html = [];
            var $copy = null;
            var $copyBtn = null;
            var $panel = $('.planTemplate-panel', that.$context);
            var text = this.settings.label;

            html.push('<div class="planTemplate-copy">',
                        '<div class="planTemplate-copy-hd">',
                          '<strong>复制到</strong>',
                          '<label><input type="checkbox" /> 全选</label>',
                        '</div>',
                        '<div class="planTemplate-copy-bd">');

            for (var i = 0; i < text.length; i++) {
                html.push('<label><input type="checkbox" data-index="'+i+'" /> ' + text[i] + '</label>')
            }

            html.push('</div>',
                        '<div class="planTemplate-copy-ft">',
                          '<button class="btn btn-primary planTemplate-copy-confirm" type="button">确定</button>',
                          '<button class="btn planTemplate-copy-cancel" type="button">取消</button>',
                        '</div>',
                        '<i></i>',
                      '</div>',
                      '<span class="planTemplate-copy-button"></span>');
            
            $(html.join('')).appendTo($panel);

            $copy = $('.planTemplate-copy', that.$context);
            $copyBtn = $('.planTemplate-copy-button', that.$context);

            that.initEvents($copyBtn, $copy);

            this.$context.on('click', '.planTemplate-copy-button', function() {
                var $this = $(this);
                var index = $this.data('index');
                var temp;

                $('.planTemplate-copy-hd input', that.$context).removeAttr('checked');
                $('.planTemplate-copy-bd input', that.$context).removeAttr('checked');
                $('.planTemplate-copy-bd input', that.$context).removeAttr('disabled');
                $('.planTemplate-copy-bd input', that.$context).eq(index).attr({
                    checked: 'checked',
                    disabled: 'disabled'
                })

                if (index >= 5) {
                    temp = 159;
                    $('.planTemplate-copy i', that.$context).addClass('planTemplate-copy-spe');
                } else {
                    temp = 65;
                    $('.planTemplate-copy i', that.$context).removeClass('planTemplate-copy-spe');
                }

                $('.planTemplate-copy', that.$context).css({
                    top: parseInt($this.css('top')) - temp
                }).show();                

            });

            this.$context.on('mouseenter', '.planTemplate-copy', function() {
                $(this).show();
            })

            this.$context.on('click', '.planTemplate-copy-hd input', function() {
                if (this.checked) {
                    $('.planTemplate-copy-bd input', that.$context).prop('checked', true);
                } else {
                    $('.planTemplate-copy-bd input', that.$context).prop('checked', false);
                    $('.planTemplate-copy-bd input:disabled', that.$context).prop('checked', true);
                }
            });

            this.$context.on('click', '.planTemplate-copy-bd input', function() {
                if (this.checked) {
                    if ($('.planTemplate-copy-bd input', that.$context).length == $('.planTemplate-copy-bd input:checked', that.$context).length) {
                        $('.planTemplate-copy-hd input', that.$context).prop('checked', true);
                    }
                } else {
                    $('.planTemplate-copy-hd input', that.$context).prop('checked', false);
                }
            });

            this.$context.on('click', '.planTemplate-copy-cancel', function() {
                $('.planTemplate-copy', that.$context).hide();
            });

            this.$context.on('click', '.planTemplate-copy-confirm', function() {
                var barIndex = $('.planTemplate-copy-button', that.$context).data('index');
                var time = $.extend([],that.time[barIndex]);
                var position = $.extend([],that.position[barIndex]);

                $('.planTemplate-copy-bd input', that.$context).each(function() {
                    var index = 0;
                    if (this.checked) {
                        index = $(this).data('index');
                        that.position[index] = $.extend(true, [], position);
                        that.time[index] = $.extend(true, [], time);
                    }
                });

                $('.planTemplate-copy', that.$context).hide();
                that.initPanel();
                that.render(that.position);

            })

        }

    };

    $.fn[pluginName] = function(options) {

        this.each(function() {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new PlanTemplate($(this), options));
            }
        })
        
        return $.data(this[0], "plugin_" + pluginName);
        
    };
})(jQuery);

/**
 * 计划模板查看组件
 * @author liuqinghu@hikvision.com.cn
 * @date   2014-07-30
 * @update 2014-07-30
 */

;(function($) {
    // 插件名字
    var pluginName = 'planTemplateView';

    // 默认配置
    var defaults = {
        type: 'week',
        label: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
        barHeight: 31,      // 拖动条高度
        scaleHeight: 36,    // 刻度高度
        stepWidth: 8 ,      // 最小拖动宽度
        stepMinutes: 15    // 最小拖动分钟数 
    };

    // 周计划配置
    var week_settings = {
        
    };

    // 假日组配置
    var holiday_settings = {
        label: ["<span>2014-07-30</span><span>2014-07-30</span>"]
    };

    // 门状态配置
    var doorStatus_settings = {
        buttons: [
            {
                text: '常开',
                color: 'blue'
            },
            {
                text: '常关',
                color: 'yellow'
            }
        ]
    };

    // 密码认证配置
    var password_settings = {
        title: '请设置“卡+密码”认证时段'
    }

    // 计划模板
    function PlanTemplateView(element, options) {
        this.$context = element;
        this.settings = null;
        this.position = [];
        this.time = [];
        this.hasType = false;

        // 根据type类型选择默认配置
        switch (options.type) {
            case 'week':
                this.settings = $.extend({}, defaults, week_settings, options);
                break;
            case 'holiday':
                this.settings = $.extend({}, defaults, holiday_settings, options);
                break;
            case 'doorStatus':
                this.settings = $.extend({}, defaults, doorStatus_settings, options);
                break;
            case 'password':
                this.settings = $.extend({}, defaults, password_settings, options);
                break;
            default: 
                this.settings = $.extend({}, defaults, options);
                break;
        }

        this.init();
    }

    PlanTemplateView.prototype = {

        // 方法初始化入口
        init: function() {
            this.createPanel();
            this.setStyle();
            this.hover();
        },

        // 创建主面板
        createPanel: function() {
            var html = [];
            var len = this.settings.label.length;

            html.push('<div class="planTemplateView-panel">',
                       '<div class="planTemplateView-scale"></div>');

            if (this.settings.type != 'holiday') {
                for (var i = 0; i < len; i++) {
                    html.push('<div class="planTemplateView-bar data-index="' + i + '"></div>',
                              '<div class="planTemplateView-label">' + this.settings.label[i] + '</div>')
                }
            }
            
            html.push('<div class="planTemplateView-time"></div>');
            html.push('</div>');

            this.$context.append($(html.join('')));

            if ($.isArray(this.settings.buttons)) {
                this.createHeader();
            }

        },

        // 创建头部
        createHeader: function() {
            var that = this;
            var html = [];
            var $header = null;

            html.push('<div class="planTemplateView-header"></div>');

            $header = $(html.join('')).appendTo(this.$context);

            $('.planTemplateView-panel', this.$context).css({
                top: $header.height()
            });

            this.$context.height(this.$context.height() + $header.height());

            this.initButtons();
        },

        // 创建按钮组
        initButtons: function() {
            var that = this;
            var html = [];
            var buttons = this.settings.buttons;

            html.push('<ul class="planTemplateView-buttons">')

            for (var i = 0; i < buttons.length; i++) {
                html.push('<li class="' + buttons[i].color +'">' + buttons[i].text + '</li>');
            }

            html.push('</ul>')

            $(html.join('')).appendTo(this.$context.find('.planTemplateView-header'));

        },

        // 设置主面板里面各个元素的样式
        setStyle: function() {
            var settings = this.settings;

            // 单位高度
            var oneHeight = settings.barHeight;

            this.$context.addClass('planTemplateView');

            if ($('.planTemplateView-bar', this.$context).length < 1) {
                return;
            }

            $('.planTemplateView-bar', this.$context).each(function(index) {
                if (index == 0) {
                    $(this).addClass('planTemplateView-bar-first');
                }

                $(this).css({
                    // scaleHeight - 1为第一个刻度条的高度
                    top: index * oneHeight + settings.scaleHeight - 1
                });

                $(this).data('index', index);
            });

            $('.planTemplateView-label', this.$context).each(function(index) {
                if (index == 0) {
                    $(this).addClass('planTemplateView-label-first');
                }

                $(this).css({
                    top: index * oneHeight + settings.scaleHeight - 1
                })
            });
        },

        initPanel: function() {
            this.position = [];
            this.time = [];
            $('.planTemplate-control', this.$context).hide();
            $('.planTemplateView-slider', this.$context).remove();
        },

        // 供外部调用的设置数据接口
        setData: function(dataObj) {
            if (!dataObj) {
                return;
            }

            var data = null;
            if (this.settings.type == 'holiday') {
                data = dataObj.plan;
                this.date = dataObj.date;
            } else {
                data = dataObj;
            }

            if (!$.isArray(data)) {
                return;
            }

            this.initPanel();

            for (var i = 0; i < data.length; i++) {
                this.time.push(this.timeStrToArr(data[i]));
            }

            if ($.isArray(this.settings.buttons)) {
                this.hasType = true;
            }

            this.timeToPosition();

            this.render(this.position);

        },

        // 数据渲染引擎
        render: function(pos) {
            var $bar = null;
            var html = [];
            var color = '';
            var len;

            if (this.settings.type == 'holiday') {
                len = this.date.length;

                for (var i = 0; i < len; i++) {
                    html.push('<div class="planTemplateView-bar"></div>',
                              '<div class="planTemplateView-label">',
                                '<span>' + this.date[i].split(',')[0] + '</span>',
                                '<span>' + this.date[i].split(',')[1] + '</span>',
                              '</div>');
                }

                this.$context.append($(html.join('')));

                this.setStyle();
                this.$context.height(this.settings.scaleHeight + (this.settings.barHeight) * len - 1);
            }

            $bar = $('.planTemplateView-bar', this.$context);

            if (this.hasType) {
                for (var i = 0; i < pos.length; i++) {
                    html = [];
                    for (var j = 0; j < pos[i].length; j++) {
                        color = pos[i][j][2] == 2 ? 'blue' : 'yellow';
                        html.push('<div class="planTemplateView-slider ' + color + '" style="width:' + (pos[i][j][1] - pos[i][j][0]) + 'px; left:' + pos[i][j][0] +'px;"></div>')
                    }
                    $bar.eq(i).append(html.join(''));
                }
            } else {
                for (var i = 0; i < pos.length; i++) {
                    html = [];
                    for (var j = 0; j < pos[i].length; j++) {
                        color = pos[i][j][2] == 1 ? 'blue' : 'yellow';
                        html.push('<div class="planTemplateView-slider blue" style="width:' + (pos[i][j][1] - pos[i][j][0]) + 'px; left:' + pos[i][j][0] +'px;"></div>')
                    }
                    $bar.eq(i).append(html.join(''));
                }
            }
            
        },

        // 把一组时间字符串转化为数组
        timeStrToArr: function(str) {
            if (!str) {
                return [];
            }
            var a = str.split(";");
            var b = [];
            for(var i=0; i<a.length;i++){
                if(a[i]){
                    var c = a[i].split(",");
                    var d = [];
                    for(var j=0; j<c.length; j++){
                        if(j == 1){
                            d.push(parseInt(c[j]) + 1);
                        } else {
                            d.push(parseInt(c[j]));
                        }
                    }
                    b.push(d);
                }
            }
            return b;
        },

        // 把时间数组转换为位置数组
        timeToPosition: function() {
            var i, j, k;
            var arr = $.extend(true, [], this.time);
            var stepMinutes = this.settings.stepMinutes;
            var stepWidth = this.settings.stepWidth;

            if (this.hasType) {
                for (i = 0; i < arr.length; i++) {
                    for (j = 0; j < arr[i].length; j++) {
                        arr[i][j][0] = (arr[i][j][0] * stepWidth) / (stepMinutes * 60);
                        arr[i][j][1] = (arr[i][j][1] * stepWidth) / (stepMinutes * 60);
                        arr[i][j][2] = arr[i][j][2];
                    }
                }
            } else {
                for (i = 0; i < arr.length; i++) {
                    for (j = 0; j < arr[i].length; j++) {
                        for (k = 0; k < arr[i][j].length; k++) {
                            arr[i][j][k] = (arr[i][j][k] * stepWidth) / (stepMinutes * 60);
                        }
                    }
                }
            }

            this.position = arr;
        },

        formatNum: function(num) {
            return num < 10 ? '0' + num : num;
        },

        hover: function() {
            var that = this;
            var $time = $('.planTemplateView-time', this.$context);

            this.$context.on('mouseenter', '.planTemplateView-slider', function() {
                var $this = $(this);
                var $parent = $this.parent();
                var barIndex = $parent.data('index');
                var sliderIndex = $this.index();
                var labelWidth = $('.planTemplateView-label', this.$context).outerWidth();
                var begin = that.position[barIndex][sliderIndex][0];
                var end = that.position[barIndex][sliderIndex][1];
                var beginTime = that.time[barIndex][sliderIndex][0];
                var endTime = that.time[barIndex][sliderIndex][1];
                var beginHours = that.formatNum(Math.floor(beginTime / 3600));
                var beginMinutes = that.formatNum(Math.floor((beginTime - beginHours * 3600) / 60));
                var endHours = that.formatNum(Math.floor(endTime / 3600));
                var endMinutes = that.formatNum(Math.floor((endTime - endHours * 3600) / 60));

                
                $time.text(beginHours + ':' + beginMinutes + ' - ' + endHours + ':' + endMinutes);

                $time.css({
                    left: labelWidth + begin + (end - begin) / 2 - $time.outerWidth() / 2,
                    top: parseInt($parent.css('top')) - $this.outerHeight() - 13
                }).show();
            });

            this.$context.on('mouseleave', '.planTemplateView-slider', function() {
                $time.hide();
            });

        }

    };

    $.fn[pluginName] = function(options) {

        this.each(function() {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new PlanTemplateView($(this), options));
            }
        })
        
        return $.data(this[0], "plugin_" + pluginName);
        
    };
})(jQuery);

