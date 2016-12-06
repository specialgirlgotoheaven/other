<%@ page contentType="text/html; charset=UTF-8"%>
<%@ include file="../../../frame/html_head.jsp"%>
<style>
    body {background: #fff;}
</style>
<link rel="stylesheet" href="/lib/planTemplate/css/planTemplate.css">
<link rel='stylesheet' href='../../datepicker/dist/assets/css/HikLY.css'></link>
    <button id="test">button</button>
    <div id="planTemplate-holiday" class="planTemplate"></div>
    <button id="getData-holiday" type="button">获取数据</button>

    <div id="planTemplate-week" class="planTemplate"></div>
    <button id="getData-week" type="button">获取数据</button>

    <div id="planTemplate-doorStatus" class="planTemplate"></div>
    <button id="getData-doorStatus" type="button">获取数据</button>

    <div id="planTemplate-password" class="planTemplate"></div>
    <button id="getData-password" type="button">获取数据</button>

<!-- <script src="../../jquery/jquery-1.8.2.min.js"></script> -->
<script>
    if (typeof window.console == 'undefined' ) {
        window.console = {};
        window.console.log = function() {

        }
    }

</script>
<script src="../../datepicker/dist/js/_B.min.js"></script>
<script src="../../datepicker/dist/assets/lang/lang_cn.js"></script>
<script src="../../datepicker/dist/js/HikLY.min.js"></script>
<script src="/lib/timepicker/jquery-ui-timepicker-addon.js"></script>
<script src="/lib/planTemplate/js/planTemplate.js"></script>

<!-- <script src="../../My97DatePicker/WdatePicker.js"></script> -->
<script>
    var week = $("#planTemplate-week").planTemplate({
        type: "week"
    });

    var holiday = $("#planTemplate-holiday").planTemplate({
        type: "holiday"
    });

    var doorStatus = $("#planTemplate-doorStatus").planTemplate({
        type: "doorStatus"
    });

    var password = $("#planTemplate-password").planTemplate({
        type: "password"
    });

    $('#getData-week').click(function() {
        // week.setData(["0,11699;14400,21599;23400,34199;", "", "0,11699;14400,21599;23400,34199;", "", "", "", ""]);
        if (week.isValid()) {
            console.log(week.getData());
        }
    })

    $('#getData-holiday').click(function() {
        // var holidayData = {
        //     date: ['2014-05-01,2014-05-03',
        //            '2014-09-06,2014-09-08',
        //            '2014-10-01,2014-10-07'],
        //     plan: ['0,5000;10000,15000;20000,25000;',
        //            '0,5000;10000,15000;20000,25000;',
        //            '0,5000;10000,15000;20000,25000;']
        // }

        // holiday.setData(holidayData);

        if (holiday.isValid()) {
            console.log(holiday.getData());
        }
    })

    $('#getData-doorStatus').click(function() {
        // console.log(doorStatus.isValid());
        // console.log(doorStatus.getData());
        // doorStatus.setData(["1800,11700,3;14400,21600,3;23400,34200,2;", "", "", "", "", "", ""]);
        if (doorStatus.isValid()) {
            console.log(doorStatus.getData());
        }
    })

    $('#getData-password').click(function() {
         if (password.isValid()) {
            console.log(password.getData());
        }
    })

</script>
</body>
</html>