

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
    $('form#the-alligator').on('submit', function(event){
        event.preventDefault();

        parse_food($(this).find('#food').val());
    })
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



/* parse the alligator food */

    var parse_food = function(food) {
        var lines = food.split(/\n/);
        var events = [];
        var i, time_strings;


        var parse_ical_datetime = function(datetime) {
            var data_arr = datetime.split(' ');
            var data = {};
            var day_month, year, tim, tim_arr;
            if (data_arr.length === 3) {
                day_month = data_arr[0].split('.');
                data['day'] = day_month[0];
                data['month'] = day_month[1];
                year = data_arr[1].split('.');
                data['year'] = year[0];
                tim = data_arr[2];
            } else {
                tim = data_arr[0];
            }
            tim_arr = tim.split(':');
            data['hour'] = tim_arr[0];
            data['min'] = tim_arr[1];
            data['sec'] = tim_arr[2];
            return data;
        };


        var last_row = 'empty';
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
                time_strings = line.split('  to ');

                tp_start = TimePoint(parse_ical_datetime(time_strings[0]));
                tp_stop = TimePoint(tp_start, parse_ical_datetime(time_strings[1]));
                last_row.set_start(tp_start);
                last_row.set_stop(tp_stop);
                events.push(last_row);
            }
        }

        console.info(events);
    };

