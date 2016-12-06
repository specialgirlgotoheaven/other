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

            if ($.isArray(this.settings.buttons) && this.settings.buttons.length > 1) {
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
                        color = pos[i][j][2] == 1 ? 'blue' : 'yellow';
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
            var a = str.split(";");
            var b = [];
            for(var i=0; i<a.length;i++){
                if(a[i]){
                    var c = a[i].split(",");
                    var d = [];
                    for(var j=0; j<c.length; j++){
                        if(c[j]){
                            d.push(+c[j]);
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
                $.data(this, "plugin_" + pluginName, new PlanTemplate($(this), options));
            }
        })
        
        return $.data(this[0], "plugin_" + pluginName);
        
    };
})(jQuery);