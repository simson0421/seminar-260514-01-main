/* ───────────────────────────────────────────────────────┐
 * file name : common_kor.js
 * description : 비상 국어 5, 6학년 차시창 공용코드 모음
 * create date : 2026-01-12 18:10:20
 * creator : kdg
 * modify:
 * usage:
└────────────────────────────────────────────────────── */
/**
 * 누적 체크리스트
 * @param {JQuery} wrap  startContents 가 만들어질 요소
 * @param {Number} group 별표 그룹의 총 개수
 * @param {Number|Array} star 별표 그룹내 별의 총 개수(모두 같으면 정수, 그룹별로 다르다면 array)
 */
let starContents = function starContents(wrap, group, star) {
    var self = this;
    this.wrap = wrap;

    this.groupTotal = group || 1;
    this.starTotal = star || 3;

    this.conWrap = '';          // .starContent
    this.starGroups = '';       // .starContent .starGroup
    this.stars = '';            // .starContent .starGroup .star

    this.init = function () {
        if (self.wrap.find('.starContent').length > 0) {
            self.wrap.find('.starContent').remove();
        }

        // 깜빡임 방지
        imgPreLoad([
            '../../common/images/clickitem/star.png',
            '../../common/images/clickitem/star1_on.png',
            '../../common/images/clickitem/star2_on.png',
            '../../common/images/clickitem/star3_on.png',
        ], true);


        self.makeCon();
        self.makeStarGroup();
        self.makeStar();

        self.addEvent();
    };

    this.reset = function () {
        self.stars.removeClass('on');
    };

    this.makeCon = function () {
        var html = '';
        html += '<div class="starContent"></div>';
        self.wrap.append(html);
        self.conWrap = self.wrap.find('.starContent');
    };

    this.makeStarGroup = function () {
        var html = '';
        for (var i = 0; i < self.groupTotal; ++i) {
            html += '<div class="starGroup starGroup' + (i + 1) + '"></div>';
        }
        self.conWrap.append(html);
        self.starGroups = self.conWrap.find('.starGroup');
    };

    this.makeStar = function () {
        var html = '';
        var i, k;
        if (Array.isArray(self.starTotal)) {
            for (i = 0; i < self.starTotal.length; ++i) {
                html = '';
                for (k = 0; k < self.starTotal[i]; ++k) {
                    html += '<div class="star star' + (k + 1) + '"></div>';
                }
                self.starGroups.eq(i).append(html);
            }
        }
        else {
            self.starGroups.each(function () {
                html = '';
                for (k = 0; k < self.starTotal; ++k) {
                    html += '<div class="star star' + (k + 1) + '"></div>';
                }
                $(this).append(html);
            });
        }

        self.stars = self.conWrap.find('.star');
    };


    this.addEvent = function () {
        self.stars.on('click', function () {
            effectAdo('click', false);

            var $ts = $(this);
            var idx = $ts.index();
            var stars = $ts.closest('.starGroup').find('.star');

            if ($(this).hasClass('on') && !$(this).next().hasClass('on')) {
                $(this).removeClass('on');
                return false;
            }

            stars.removeClass('on');
            idx += 1;

            for (var i = 0; i < idx; i++) {
                stars.eq(i).addClass('on');
            }
        });
    };
};

/**
 * 평가 체크리스트
 * @param {JQuery} wrap  startContents 가 만들어질 요소
 * @param {Number} group 별표 그룹의 총 개수
 * @param {Number|Array} star 별표 그룹내 별의 총 개수(모두 같으면 정수, 그룹별로 다르다면 array)
 */
let starContents2 = function starContents2(wrap, group, star) {
    starContents.call(this, wrap, group, star);
    var self = this;

    this.init = function () {
        if (self.wrap.find('.starContent').length > 0) {
            self.wrap.find('.starContent').remove();
        }

        self.makeCon();
        self.makeStarGroup();
        self.makeStar();

        self.addEvent();
    }

    this.addEvent = function () {
        self.stars.on('click', function () {
            effectAdo('click', false);

            var $ts = $(this);

            if ($ts.hasClass('on')) {
                $ts.removeClass('on');
            }
            else{
                $ts.addClass('on').siblings('.star').removeClass('on');
            }
        });
    };
}
starContents2.prototype = Object.create(starContents.prototype);
starContents2.prototype.constructor = starContents2;


/**
 * 카드 섞기
 * @param {JQuery} time  전체 시간
*/
var cardp;
var cardp2;

var cardSwap1;
var cardSwap2;

function cardSet(time) {
    wrapTop.addClass('dis');
    $('.gamePageWrap').addClass('com');

    // 섞기 모션
    cardSwap1 = setTimeout(function () {
        $('.gamePageWrap').addClass('animate');
    }, 500);
    cardSwap2 = setTimeout(function () {
        $('.gamePageWrap').removeClass('animate');
    }, time);

    $('.gamePageWrap .cardGame').off(sAnimationStart).on(sAnimationStart, function () {
        effectAdo('shuffle');
    });

    // 펼치는 모션
    cardp = setTimeout(function () {
        $('.gamePageWrap').addClass('st');
        $('.gamePageWrap').removeClass('com');
        // 클릭가능
        cardp2 = setTimeout(function () {
            $('.gamePageWrap').addClass('ready');
            wrapTop.removeClass('dis');
        }, 1100);

    }, time + 200);
}

/**
 * 오각형 방사형 선 잇기(클릭)
 * @param {JQuery} wrap pentagonContents가 만들어질 요소
*/
let pentagonContents = function pentagonContents(wrap) {
    const self = this;
    this.wrap = wrap;

    this.pentagonWrap;
    this.dotWrap;
    this.dotSec;
    this.dot;

    this.rebtn;

    this.svg;

    this.strokeColor = '#c00000';
    this.strokeWidth = '10px';

    this.init = function () {
        if (self.wrap.find('.pentagonWrap').length > 0) {
            self.wrap.find('.pentagonWrap').remove();
        }

        self.makeWrap();
        self.makeItem();
        self.createSVG();

        self.addEvent();
    }

    this.addEvent = function () {
        self.rebtn.hide();
        self.dot.off('click').on('click', function () {
            let isRec = $(this);
            let secIdx = Number(isRec.closest('.dotSec').attr('data-section'));

            let prevIdx = (secIdx - 1) < 0 ? 4 : secIdx - 1;
            let nextIdx = (secIdx + 1) > 4 ? 0 : secIdx + 1;

            let startDot;
            let endDot;

             effectAdo('click');

            if (!isRec.hasClass('on')) {
                isRec.addClass('on').siblings('.dot').removeClass('on');

                self.rebtn.show();

                startDot = self.dotWrap.find(`.dotSec[data-section="${secIdx}"] .dot.on`);

                if (self.dotWrap.find(`.dotSec[data-section="${prevIdx}"] .dot.on`).length > 0) {
                    wrap.find(`.line[startSection="${secIdx}"][endSection="${prevIdx}"]`).remove();
                    wrap.find(`.line[startSection="${prevIdx}"][endSection="${secIdx}"]`).remove();
                    endDot = self.dotWrap.find(`.dotSec[data-section="${prevIdx}"] .dot.on`);
                    self.connectLine(startDot, endDot, secIdx, prevIdx);
                }
                if (self.dotWrap.find(`.dotSec[data-section="${nextIdx}"] .dot.on`).length > 0) {
                    wrap.find(`.line[startSection="${secIdx}"][endSection="${nextIdx}"]`).remove();
                    wrap.find(`.line[startSection="${nextIdx}"][endSection="${secIdx}"]`).remove();
                    endDot = self.dotWrap.find(`.dotSec[data-section="${nextIdx}"] .dot.on`);
                    self.connectLine(startDot, endDot, secIdx, nextIdx);
                }
            }
            else {
                if (self.dotWrap.find(`.dotSec[data-section="${prevIdx}"] .dot.on`).length > 0) {
                    wrap.find(`.line[startSection="${secIdx}"][endSection="${prevIdx}"]`).remove();
                    wrap.find(`.line[startSection="${prevIdx}"][endSection="${secIdx}"]`).remove();
                }
                if (self.dotWrap.find(`.dotSec[data-section="${nextIdx}"] .dot.on`).length > 0) {
                    wrap.find(`.line[startSection="${secIdx}"][endSection="${nextIdx}"]`).remove();
                    wrap.find(`.line[startSection="${nextIdx}"][endSection="${secIdx}"]`).remove();
                }
                isRec.removeClass('on');

                if(self.dotWrap.find(`.dotSec .dot.on`).length == 0){
                    self.rebtn.hide();
                }
            }
        });

        self.rebtn.off('click').on('click', function () {
            effectAdo('click');
            self.rebtn.hide();
            self.dot.removeClass('on');
            wrap.find(`.line`).remove();
        });
    }

    this.connectLine = function (startPoint, endPoint, startSection, endSection) {
        let p1_offset = startPoint.offset();
        let p2_offset = endPoint.offset();
        let p1_width = startPoint.width();
        let p1_height = startPoint.height();
        let p2_width = endPoint.width();
        let p2_height = endPoint.height();

        let container_offset = self.pentagonWrap.offset();

        let x1 = (p1_offset.left - container_offset.left) / factor + p1_width / 2;
        let y1 = (p1_offset.top - container_offset.top) / factor + p1_height / 2;
        let x2 = (p2_offset.left - container_offset.left) / factor + p2_width / 2;
        let y2 = (p2_offset.top - container_offset.top) / factor + p2_height / 2;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        $(line).attr({
            'class': `line`,
            'startSection': startSection,
            'endSection': endSection,
            'x1': x1,
            'y1': y1,
            'x2': x2,
            'y2': y2,
            'stroke': self.strokeColor,
            'stroke-width': self.strokeWidth,
        });
        self.svg.append(line);
    }

    this.makeWrap = function () {
        let html_pentagonWrap = '<div class="pentagonWrap"></div>';
        self.wrap.append(html_pentagonWrap);
        self.pentagonWrap = self.wrap.find('.pentagonWrap');

        let html_dotWrap = '<div class="dotWrap"></div>';
        self.pentagonWrap.append(html_dotWrap);
        self.dotWrap = self.wrap.find('.dotWrap');

        let html_rebtn = '<div class="ansbtn re"></div>';
        self.wrap.append(html_rebtn);
        self.rebtn = self.wrap.find('.ansbtn.re');
    };

    this.makeItem = function () {
        for (let i = 0; i < 5; i++) {
            let html_dotsec = `<div class="dotSec" data-section="${i}"></div>`;
            self.dotWrap.append(html_dotsec);
            for (let j = 0; j < 5; j++) {
                let html_dot = `<div class="dot" data-idx="${j}"></div>`;
                self.pentagonWrap.find(`.dotSec[data-section="${i}"]`).append(html_dot);
            }
        }
        self.dotSec = self.wrap.find('.dotSec');
        self.dot = self.wrap.find('.dot');
    };

    this.createSVG = function () {
        self.svg = document.createElementNS('http://www.w3.org/2000/svg', "svg");
        $(self.svg).attr("xmlns", "http://www.w3.org/2000/svg");
        $(this.svg).attr("width", wrapW);
        $(this.svg).attr("height", wrapH);
        $(self.svg).css("position", "absolute");
        $(self.svg).css("pointer-events", "none");
        $(self.svg).insertAfter(self.dotWrap[0]);
    }
}

/**
 * 오각형 방사형 선 잇기(클릭)
 * @param {JQuery} wrap triangleContents가 만들어질 요소
*/
let triangleContents = function triangleContents(wrap) {
    pentagonContents.call(this, wrap);
    var self = this;
    
    this.addEvent = function () {
        self.rebtn.hide();
        self.dot.off('click').on('click', function () {
            let isRec = $(this);
            let secIdx = Number(isRec.closest('.dotSec').attr('data-section'));

            let prevIdx = (secIdx - 1) < 0 ? 2 : secIdx - 1;
            let nextIdx = (secIdx + 1) > 2 ? 0 : secIdx + 1;

            let startDot;
            let endDot;

             effectAdo('click');

            if (!isRec.hasClass('on')) {
                isRec.addClass('on').siblings('.dot').removeClass('on');

                self.rebtn.show();

                startDot = self.dotWrap.find(`.dotSec[data-section="${secIdx}"] .dot.on`);

                if (self.dotWrap.find(`.dotSec[data-section="${prevIdx}"] .dot.on`).length > 0) {
                    wrap.find(`.line[startSection="${secIdx}"][endSection="${prevIdx}"]`).remove();
                    wrap.find(`.line[startSection="${prevIdx}"][endSection="${secIdx}"]`).remove();
                    endDot = self.dotWrap.find(`.dotSec[data-section="${prevIdx}"] .dot.on`);
                    self.connectLine(startDot, endDot, secIdx, prevIdx);
                }
                if (self.dotWrap.find(`.dotSec[data-section="${nextIdx}"] .dot.on`).length > 0) {
                    wrap.find(`.line[startSection="${secIdx}"][endSection="${nextIdx}"]`).remove();
                    wrap.find(`.line[startSection="${nextIdx}"][endSection="${secIdx}"]`).remove();
                    endDot = self.dotWrap.find(`.dotSec[data-section="${nextIdx}"] .dot.on`);
                    self.connectLine(startDot, endDot, secIdx, nextIdx);
                }
            }
            else {
                if (self.dotWrap.find(`.dotSec[data-section="${prevIdx}"] .dot.on`).length > 0) {
                    wrap.find(`.line[startSection="${secIdx}"][endSection="${prevIdx}"]`).remove();
                    wrap.find(`.line[startSection="${prevIdx}"][endSection="${secIdx}"]`).remove();
                }
                if (self.dotWrap.find(`.dotSec[data-section="${nextIdx}"] .dot.on`).length > 0) {
                    wrap.find(`.line[startSection="${secIdx}"][endSection="${nextIdx}"]`).remove();
                    wrap.find(`.line[startSection="${nextIdx}"][endSection="${secIdx}"]`).remove();
                }
                isRec.removeClass('on');

                if(self.dotWrap.find(`.dotSec .dot.on`).length == 0){
                    self.rebtn.hide();
                }
            }
        });

        self.rebtn.off('click').on('click', function () {
            effectAdo('click');
            self.rebtn.hide();
            self.dot.removeClass('on');
            wrap.find(`.line`).remove();
        });
    }

    this.makeItem = function () {
        for (let i = 0; i < 3; i++) {
            let html_dotsec = `<div class="dotSec" data-section="${i}"></div>`;
            self.dotWrap.append(html_dotsec);
            for (let j = 0; j < 5; j++) {
                let html_dot = `<div class="dot" data-idx="${j}"></div>`;
                self.pentagonWrap.find(`.dotSec[data-section="${i}"]`).append(html_dot);
            }
        }
        self.dotSec = self.wrap.find('.dotSec');
        self.dot = self.wrap.find('.dot');
    };
}
triangleContents.prototype = Object.create(pentagonContents.prototype);
triangleContents.prototype.constructor = triangleContents;

/**
 * 캐릭터 음원 컨텐츠 - 국어용(기본, 누적, 순차 클릭 가능)
 * @param {*} wrap aniContents가 생성될 요소
 * @param {Array} set ado, img 생성 정보값
 * @param {String} adoPath 오디오 파일 경로
 * @param {boolean} bStopOther 다른 음성요소 정지 시킬지 여부
 */
let aniContents2 = function aniContents2(wrap, set, adoPath, bStopOther) {
    aniContents.call(this, wrap, set, adoPath, bStopOther);
    var self = this;
    this.sequence =  (set.sequence === true) ? true : false;

    this.init = function () {
        if (self.wrap.find('.aniWrap').length > 0) {
            self.wrap.find('.aniWrap').remove();
        }

        self.cnt = 0;
        self.allChk = false;

        self.makeWrap();
        self.makeItem();
        self.makeBtn();

        self.addEventItem();
        self.addEventBtn();
    }

    this.makeItem = function () {
        let html = '';
        for (let i = 0; i < self.adoItems.length; i++) {
            html += `<div class="aniItem aniItem${i + 1}"></div>`;
        }
        self.itemwrap.append(html);
        self.items = self.itemwrap.find('.aniItem');

        self.items.html('');
        for (let j = 0; j < self.items.length; j++) {
            self.items.eq(j).append(`<div class="char"></div>`);
            if(typeof(self.adoItems[j]) === 'string'){
                self.items.eq(j).append(`
                    <div class="item">
                        <div class="close"></div>
                    </div>
                `);
            }
            else{
                for (let k = 0; k < self.adoItems[j].length; k++) {
                    self.items.eq(j).append(`
                        <div class="item item${k + 1}">
                            <div class="close"></div>
                        </div>
                    `);
                };
            }
        }
    }

    this.addEventItem = function () {
        if(self.sequence){
            self.items.addClass('off').eq(0).removeClass('off');
        }
        self.items.off('click').on('click', function (e) {
            e.stopPropagation();
            ado_stop();

            self.allChk = false;
            let cnt = 0;

            let $this = $(this);
            let idx = $this.index();

            if ($this.hasClass('ing')) {
                if(!self.sequence){
                    $this.removeClass('ing on').removeAttr('data-scene');
                }
                else{
                    for (let i = 0; i < self.items.length - idx; i++) {
                        $this.removeClass('ing on').removeAttr('data-scene');
                        self.items.eq(self.items.length - (i)).removeClass('ing on').addClass('off').removeAttr('data-scene');
                    }
                }
            }
            else {
                self.items.removeClass('on').addClass('off');
                $this.addClass('ing on');
                if(typeof(self.adoItems[idx]) === 'string'){
                    effectAdo(self.adoItems[idx], self.bStopOther, adoPath);
                    $(`#${self.adoItems[idx]}`).off('ended').on('ended', function () {
                        $this.removeClass('on');
                        if(!self.sequence){
                            self.items.removeClass('off');
                        }
                        else{
                            for (let j = 0; j <= idx; j++) {
                                self.items.eq(j).removeClass('off');
                            }
                            if (self.adoItems[idx + 1] !== undefined) {
                                $this.next().removeClass('off');
                            }
                            else{
                                if (typeof (self.onEnded) !== 'undefined') { self.onEnded(); }
                            }
                        }
                    });
                }
                else{
                    continuePlay();
                    function continuePlay() {
                        effectAdo(self.adoItems[idx][cnt], self.bStopOther, adoPath);
                        $(`#${self.adoItems[idx][cnt]}`).off('ended').on('ended', function () {
                            if (self.adoItems[idx][cnt + 1] !== undefined) {
                                cnt++;
                                effectAdo(self.adoItems[idx][cnt], self.bStopOther, adoPath);
                                $this.attr('data-scene', cnt + 1);
                                continuePlay();
                            }
                            else {
                                $this.removeClass('on');
                                if(!self.sequence){
                                    self.items.removeClass('off');
                                    if (typeof (self.onEnded) !== 'undefined') { self.onEnded(); }
                                }
                                else{
                                    for (let k = 0; k <= idx; k++) {
                                        self.items.eq(k).removeClass('off');
                                    }
                                    if (self.adoItems[idx + 1] !== undefined) {
                                        $this.next().removeClass('off');
                                    }
                                    else{
                                        if (typeof (self.onEnded) !== 'undefined') { self.onEnded(); }
                                    }
                                }
                            }
                        });
                    }
                }
            }

            self.items.length === self.itemwrap.find('.ing').length ? self.soundBtn.addClass('re') : self.soundBtn.removeClass('re');

            if (typeof (videoCon) != 'undefined') { videoCon.stop(); }

            if (typeof (self.onClick) !== 'undefined') { self.onClick($(this)); }
        });
    }

    this.addEventBtn = function () {
        self.soundBtn.off('click').on('click', function (e) {
            e.stopPropagation();
            ado_stop();

            self.items.removeClass('ing on');

            if ($(this).hasClass('re')) {
                $(this).removeClass('re');
                self.items.removeClass('ing on').addClass('off').removeAttr('data-scene');
                self.items.eq(0).removeClass('off');
                if (typeof (self.onReset) !== 'undefined') { self.onReset(); }
            }
            else {
                $(this).addClass('re');
                self.allSound();
                if (typeof (self.onPlayAll) !== 'undefined') { self.onPlayAll(); }
            }
        });
    }

    this.allSound = function () {
        let cnt1 = 0;
        let cnt2 = 0;
        
        self.items.removeClass('off');
        if(typeof(self.adoItems[cnt1]) === 'string'){
            stringPlay();
            function stringPlay(){
                effectAdo(self.adoItems[cnt1], self.bStopOther, adoPath);
                self.items.eq(cnt1).addClass('ing on');
                $(`#${self.adoItems[cnt1]}`).off('ended').on('ended', function () {
                    cnt1++;
                    self.items.removeClass('on');
                    if (self.adoItems[cnt1] !== undefined){
                        stringPlay();
                    };
                });
            }
        }
        else{
            arrayPlay();
            function arrayPlay() {
                effectAdo(self.adoItems[cnt1][cnt2], self.bStopOther, adoPath);
                self.items.eq(cnt1).addClass('ing on');
                $(`#${self.adoItems[cnt1][cnt2]}`).off('ended').on('ended', function () {
                    cnt2++;
                    if (self.adoItems[cnt1][cnt2] !== undefined){
                        self.items.eq(cnt1).attr('data-scene', cnt2 + 1);
                        arrayPlay();
                    }
                    else {
                        cnt1++;
                        self.items.removeClass('on');
                        if (self.adoItems[cnt1] !== undefined){
                            cnt2 = 0;
                            arrayPlay();
                        }
                    }
                });
            }
        }
    }
}
aniContents2.prototype = Object.create(aniContents.prototype);
aniContents2.prototype.constructor = aniContents2;

/**
 * dropbox
 * @param {JQuery} wrap dropbox가 만들어질 요소
 * @param {number} items checkItem 개수
*/
let dropboxContents = function dropboxContents(wrap, items) {
    const self = this;
    this.wrap = wrap;

    this.checkContent;
    this.checkItemWrap;
    this.checkItem;
    this.resultbox;
    this.dropbox;
    this.list;
    this.ansbtn;

    this.init = function () {
        if (self.wrap.find('.checkContent').length > 0) {
            self.wrap.find('.checkContent').remove();
        }

        // 깜빡임 방지
        imgPreLoad([
            '../../common/images/clickitem/list1.png',
            '../../common/images/clickitem/list2.png',
            '../../common/images/clickitem/list3.png',
        ], true);

        self.makeWrap();
        self.makeItem();

        self.addEvent();
    }

    this.addEvent = function () {
        self.dropbox.hide();
        self.resultbox.removeClass('on');
        self.ansbtn.hide();
        self.resultbox.off('click').on('click', function () {
            let $this = $(this);
            let parent = $(this).closest('.checkItem');
            if($this.hasClass('on')){
                self.resultbox.removeClass('on');
                self.dropbox.hide();
            }
            else{
                self.resultbox.removeClass('on');
                $this.addClass('on');
                self.dropbox.hide();
                parent.find('.dropbox').show();
            }
            effectAdo('click');
        });

        self.list.off('click').on('click', function () {
            let $ts = $(this);
            let parent = $(this).closest('.checkItem');
            let idx = $ts.index();
            $ts.addClass('on').siblings('.list').removeClass('on');
            self.resultbox.removeClass('on');
            parent.find('.resultbox').attr('data-list', idx);
            self.dropbox.hide();
            effectAdo('click');

            self.ansbtn.show();
        });

        self.ansbtn.off('click').on('click', function () {
            effectAdo('click');
            self.ansbtn.hide();
            self.resultbox.removeClass('on').removeAttr('data-list');
            self.dropbox.hide();
            self.list.removeClass('on');
        });
    }

    this.makeWrap = function () {
        let html_content = '<div class="checkContent"><div class="checkItemWrap"></div></div>';
        self.wrap.append(html_content);
        self.checkContent = self.wrap.find('.checkContent');
        self.checkItemWrap = self.checkContent.find('.checkItemWrap');
    };

    this.makeItem = function () {
        for (let i = 0; i < items; i++) {
            let html_items = `
                <div class="checkItem checkItem${i + 1}">
                    <div class="resultbox"></div>
                    <div class="dropbox">
                        <div class="list list1"></div>
                        <div class="list list2"></div>
                        <div class="list list3"></div>
                    </div>
                </div>
            `;
            self.checkItemWrap.append(html_items);
        }
        self.checkItem = self.checkItemWrap.find('.checkItem');
        self.resultbox = self.checkItem.find('.resultbox');
        self.dropbox = self.checkItem.find('.dropbox');
        self.list = self.dropbox.find('.list');
        
        self.wrap.append('<div class="ansbtn re"></div>');
        self.ansbtn = self.wrap.find('.ansbtn');
    };
}


/* ──────────────────────────────────────────────────────
* 이야기 읽기
/* ────────────────────────────────────────────────────── */
var readChartContents = function readChartContents(wrap, data) {
    let self = this;
    this.wrap = wrap;

    const defaults = {
        read: {
            bool: true,
            type: 1,
        },
        study: {
            bool: true,
            itmes: [true],
        },
    };
    data = $.extend(true, {}, defaults, data);
    
    this.readbtn = '';
    this.readpop = '';
    this.studybtn = ''; 
    this.studypop = '';

    this.init = function () {
        self.makeUI();
        self.addEvent();
    };

    this.makeUI = function () {
        self.wrap.empty();
        let btnWrapHtml = `<div class="btnPopupWrap"></div>`;
        self.wrap.append(btnWrapHtml);

        if(data.read.bool === true){
            let readBtnHtml = `
                <div class="btnPopup" data-type="read" data-idx="0">
                    <div class="vdo_thumb"></div>
                    <div class='tit_read'></div>
                </div>
            `;
            self.wrap.find('.btnPopupWrap').append(readBtnHtml);
            self.readbtn = self.wrap.find('.btnPopup[data-type="read"]');
            if(Number(data.read.type) == 2){
                self.readbtn.addClass('tp2');
            }

            let readPopHtml = `
                <div class="popup" data-type="read" data-idx="0">
                    <div id="videoFrame" class="videoFrame readChart"></div>
                    <div class="close"></div>
                </div>
            `;
            self.wrap.append(readPopHtml);
        }
        if(data.study.bool === true){
            self.wrap.find('.btnPopupWrap').append(`<div class="btnPopup" data-type="study" data-idx="1"></div>`);
            self.studybtn = self.wrap.find('.btnPopup[data-type="study"]');

            self.wrap.append(`<div class="popup" data-type="study" data-idx="1"><div class="tabWrap outer"></div><div class="close"></div></div>`);
            for(let i = 0; i < data.study.outer; i++){
                self.wrap.find('.tabWrap.outer').append(`<div class="tab tab${i + 1}"><div class="tabWrap inner"></div></div>`);

                for(let j = 0; j < data.study.inner[i]; j++){
                    self.wrap.find(`.tabWrap > .tab${i + 1} .tabWrap`).append(`<div class="tab tab${j + 1}"></div>`);
                }
            }
        }

        self.readpop = self.wrap.find('.popup[data-type="read"]');
        self.studypop = self.wrap.find('.popup[data-type="study"]');
    };
    
    this.addEvent = function () {
        initPop(self.wrap);

        // 이야기 읽기
        const readVdo = new videoPlayer(self.readpop.find('.videoFrame'));
        const path = pathUrl(data.read.path[0], data.read.path[1]);
        readVdo.src = path.src;
        readVdo.thumb = data.read.thumb;
        readVdo.init();
        readVdo.video.attr("poster", path.poster);
        readVdo.markMaker(data.read.mark);
        readVdo.tabMaker(data.read.tab, data.read.mark, true);

        // 교과서 학습
        self.studybtn.on('click', function(){
            const outertab = new tabContents(self.studypop.find('.tabWrap.outer'));
            outertab.init();
            outertab.btn.on("click", function () {
                outertabEvent(outertab.tab.eq(outertab.currentTab));
            });
            outertabEvent(outertab.tab.eq(0));
        });
        function outertabEvent(_tab) {
            let innertab = new tabContents(_tab.find('.tabWrap'));
            innertab.init();
            innertab.btn.on("click", function () {
                clickConEvent(innertab.tab.eq(innertab.currentTab));
            });
            clickConEvent(innertab.tab.eq(0));
        }
        function clickConEvent(_tab) {
            let clickCon = new contentsSet(_tab);
            clickCon.clickCon(2);
            if(data.study.itmes[_tab.closest('.tabWrap').parent('.tab').index()] === true && _tab.index() == 0){
                _tab.addClass('hwaldong')
                clickCon.clickCon.items.last().hide();
            }
        }
    };
};