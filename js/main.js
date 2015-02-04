

/* smooth scroll to anchor */
// uses history to keep back/forward button working
$(function(){
    $('a[href*="#"]').click(function(event) {
        var aid = $(this).attr('href').split('#')[1];
        var dom_aid = (aid == '') ? 'home' : aid;
        var $destination = $('a[name="'+ dom_aid +'"], #' + dom_aid).first();
        if ( $destination.length ){
            event.preventDefault();
            history.pushState({}, "", '#'+aid);
            var navbar_height = $('.navbar-fixed-top').height();
            $('html,body').animate({scrollTop: $destination.offset().top - navbar_height},'fast');
        }
    });
});


/* navbar active class */
$(function(){
    $('.nav.navbar-nav a').on('click', function(){
        $(this).parents('.nav.navbar-nav').find('.active').removeClass('active');
        $(this).parent().addClass('active');
    });
});


/* prevent the-alligator form from submitting */
$(function(){

    $('#spit').css({
        'opacity': 1,
        'display': 'block'
    });
    var oTable = $('#results').dataTable({
        "aoColumnDefs": [ {
          "aTargets": [ 1 ],
          "mRender": function ( data, type, full ) {
            return data.toString().toHHMMSS();
          }
        } ],
        'fnDrawCallback': function( oData ) {
            var total_events = 0, total_time = 0;
            for(var i=0; i<oData.aiDisplay.length; i++) {
                var row_data = oData.aoData[oData.aiDisplay[i]]._aData;
                total_events += row_data[2];
                total_time += row_data[1];
            }
            $(this).find('tfoot #total_events').html(total_events);
            $(this).find('tfoot #total_time').html(total_time.toString().toHHMMSS());
        },
        "sDom": 'T<"clear">lfrtip',
        "oTableTools": {
        }
    });
    setTimeout(function(){
        $('#spit').css({
            'opacity': 0,
            'display': 'none'
        });
    }, 200);

    $('form#the-alligator').on('submit', function(event){
        event.preventDefault();
        render(parse_food($(this).find('#food').val()));
    });
    $('form#the-alligator #reset').on('click', function(event){
        event.preventDefault();
        reset();
    });
});




/* Some useful classes */

var TimePoint = (function(spec, spec2) {
    var year, month, day, hour, min, sec;
    var fields = ['year', 'month', 'day', 'hour', 'min', 'sec'];
    var date;
    var i;


    /**
     * @constructor
     * @param spec another TimePoint to copy data from OR spec2
     * @param spec2 object of format: {year: 2014, month: 12, day: 28, hour: 23, min: 54, sec: 40} All fields required unless spec is specified.
     */
    function TimePoint(spec, spec2) {

        /* if user accidentally omits the new keyword, this will silently correct the problem */
        if ( !(this instanceof TimePoint) )
            return new TimePoint(spec, spec2);

        /* clone from another TimePoint */
        if ( spec instanceof TimePoint) {
            for (i=0; i<fields.length; i++){
                this[fields[i]] = spec[fields[i]];
            }

            spec = spec2;
        }

        /* set provided data */
        if ( typeof spec !== 'undefined' ) {
            for (i=0; i<fields.length; i++){
                if (typeof spec[fields[i]] !== 'undefined') {
                    this[fields[i]] = spec[fields[i]];
                }
            }
        }

        this.date = new Date(this.year, this.month - 1, this.day, this.hour, this.min, this.sec);
    }


    /**
     * @returns {Array}
     */
    TimePoint.prototype.arr = function() {
        var arr = [];
        for (i=0; i<fields.length; i++){
            arr.push(this[fields[i]]);
        }
        return arr;
    };

    /**
     * @returns {string}
     */
    TimePoint.prototype.repr = function() {
        return this.arr().join('-');
    };


    TimePoint.prototype.clone = function() {
        return new TimePoint(this, {});
    };


    /**
     * Unix Epoch seconds
     * @returns {number}
     */
    TimePoint.prototype.timestamp = function() {
        return this.date.getTime() / 1000;
    };

    return TimePoint;
})();


var TimeInterval = (function(tp_start, tp_stop){

    function TimeInterval(tp_start, tp_stop) {

        /* if user accidentally omits the new keyword, this will silently correct the problem */
        if ( !(this instanceof TimeInterval) )
            return new TimeInterval(tp_start, tp_stop);

        this.tp_start = tp_start.clone();
        this.tp_stop = tp_stop.clone();
    }

    TimeInterval.prototype.seconds = function() {
        return this.tp_stop.timestamp() - this.tp_start.timestamp()
    };

    return TimeInterval;

})();




var CalEvent = (function(name){

    function CalEvent(name) {

        /* if user accidentally omits the new keyword, this will silently correct the problem */
        if ( !(this instanceof CalEvent) )
            return new CalEvent(name);

        this.name = name;
    }

    CalEvent.prototype.set_start = function(tp_start) {
        this.tp_start = tp_start;
        this.try_set_interval();
    };

    CalEvent.prototype.set_stop = function(tp_start) {
        this.tp_stop = tp_start;
        this.try_set_interval();
    };

    CalEvent.prototype.try_set_interval = function() {
        if (this.tp_start instanceof TimePoint && this.tp_stop instanceof TimePoint) {
            this.ti = new TimeInterval(this.tp_start, this.tp_stop);
        }
    };

    CalEvent.prototype.seconds = TimeInterval.prototype.seconds;

    return CalEvent;
})();


/* handle formats storage and fetching */
$(function(){
    var $select = $('#datetime_format');
    var $custom_datetime = $('#custom_datetime');
    var $custom_time = $('#custom_time');

    var config_pack = function() {
        return {
            'select': $select.val(),
            'custom_datetime': $custom_datetime.val(),
            'custom_time': $custom_time.val()
        }
    };

    var config_unpack = function(config) {
        $select.val( config['select'] );
        $custom_datetime.val( config['custom_datetime'] );
        $custom_time.val( config['custom_time'] );
    };

    var fetch_config_from_cookie = function() {
        var format_config = $.cookie('format_config');
        config_unpack(JSON.parse(format_config));
    };

    var save_config_to_cookie = function() {
        var format_config = config_pack();
        $.cookie(
            'format_config',
            JSON.stringify(format_config),
            { expires: 365 }
        );
    };

    var format_change_handler = function() {
        save_config_to_cookie();
    };

    $select.on('input change', format_change_handler);
    $custom_datetime.on('input change', format_change_handler);
    $custom_time.on('input change', format_change_handler);

    fetch_config_from_cookie();
});


/* handle show-hide for custom format inputs */
$(function(){
    var $select = $('#datetime_format');
    var $custom_box = $('#custom_box');
    $custom_box.hide();

    var toggle_the_custom_box = function() {
        if ($select.val() == 'custom') {
            $custom_box.show();
        } else {
            $custom_box.hide();
        }
    };

    $select.on('input change', function() {
        toggle_the_custom_box();
    });
    toggle_the_custom_box();
});


/* parse the alligator food */

var parse_food = function(food) {
    var lines = food.split(/\n/);
    var events = [], aggregate = {};
    var i, time_strings;

    var DATETIME_FORMAT = $('#datetime_format :selected').data('datetimeformat');
    var TIME_FORMAT = $('#datetime_format :selected').data('timeformat');
    if (DATETIME_FORMAT == 'custom') {
        DATETIME_FORMAT = $('#custom_datetime').val();
        TIME_FORMAT = $('#custom_time').val();
    }

    // TODO allow other languages ("to" and "Scheduled:")
    var SEPARATOR = ' to ';

    var parse_ical_datetime = function(datetime) {
        datetime = datetime.trim();
        var the_moment = moment(datetime, TIME_FORMAT, true); // strict
        var what_data = 'time';
        if (!the_moment.isValid()) {
            the_moment = moment(datetime, DATETIME_FORMAT, true); // strict
            what_data = 'datetime';
        }
        if (!the_moment.isValid()) {
            if (console) {
                console.warn("cant parse: " + datetime);
                console.debug("used format: " + ((what_data == 'datetime') ? DATETIME_FORMAT : TIME_FORMAT));
                //TODO: report the error to user, limit number of error messages
            }
        }

        var data = {};
        if (what_data == 'datetime') {
            data['day'] = the_moment.format('D');
            data['month'] = the_moment.format('M');
            data['year'] = the_moment.format('YYYY');
        }
        data['hour'] = the_moment.format('H');
        data['min'] = the_moment.format('m');
        data['sec'] = the_moment.format('s');
        return data;
    };


    var last_row = 'empty';
    var tp_start, tp_stop;
    for (i=0; i<lines.length; i++) {
        var line = lines[i];
        if (! line.trim().length) {
            last_row = 'empty';
            continue;
        }
        if (last_row === 'empty') {
            last_row = new CalEvent(line.trim());
            continue;
        }
        if (last_row instanceof CalEvent) {
            line = line.trim().replace('Scheduled: ', '');
            time_strings = line.split(SEPARATOR);
            tp_start = TimePoint(parse_ical_datetime(time_strings[0]));
            tp_stop = TimePoint(tp_start, parse_ical_datetime(time_strings[1]));
            last_row.set_start(tp_start);
            last_row.set_stop(tp_stop);
            events.push(last_row);
            last_row = false;
        }
    }

    for (i=0; i<events.length; i++) {
        var event = events[i];
        if (typeof aggregate[event.name] === 'undefined') {
            aggregate[event.name] = {'seconds': 0, 'events': []};
        }
        aggregate[event.name]['seconds'] += event.seconds();
        aggregate[event.name]['events'].push(event);
    }

    return aggregate;
};


var render = function(aggregate) {
    var $results = $('#results');
    $results.dataTable().fnClearTable();
    for(var key in aggregate) {
        if (aggregate.hasOwnProperty(key)){
            $results.dataTable().fnAddData([
                key,
                aggregate[key]['seconds'],
                aggregate[key]['events'].length
            ]);
        }
    }

    var $alligator = $('#the-alligator');
    var $food_tray = $alligator.find('#food-tray');
    var $spit = $alligator.find('#spit');

    $spit.show();
    $alligator.animate({'height': $spit.height()}, 500);
    $spit.css({'opacity': 0});
    $food_tray.animate({'opacity': 0}, 500);
    $spit.animate({'opacity': 1}, 500, function(){
        $('#food').val('');
    });
    $spit.css({'position': 'absolute'});
    $food_tray.css({'position': 'absolute'});
};


var reset = function(aggregate) {

    var $alligator = $('#the-alligator');
    var $food_tray = $alligator.find('#food-tray');
    var $spit = $alligator.find('#spit');

    $food_tray.show();
    $alligator.animate({'height': $food_tray.height()}, 500);
    $food_tray.css({'opacity': 0});
    $spit.animate({'opacity': 0}, 500, function(){$spit.hide();});
    $food_tray.animate({'opacity': 1}, 500);
    $food_tray.css({'position': 'absolute'});
    $spit.css({'position': 'absolute'});
};


