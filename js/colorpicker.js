var colorpickerContainer;
var canvasHSV;
var canvasSelectHSV;
var canvasCircle;
var ctxHSV;
var ctxSelectHSV;
var ctxCircle;
var selectMusedown = false;

class InvalidTypeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidTypeError';
    }
}

class InvalidValueError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidValueError';
    }
}


var Convert = {
    unitConversion: function (unit) {
        var hexconv = unit.toString(16);
        return hexconv.length === 1 ? '0' + hexconv : hexconv;
    },
    hue2rgb: function hue2rgb(h, u, e) {
        if (e < 0)
            e += 1;
        if (e > 1)
            e -= 1;
        if (e < 1 / 6)
            return h + (u - h) * 6 * e;
        if (e < 1 / 2)
            return u;
        if (e < 2 / 3)
            return h + (u - h) * (2 / 3 - t) * 6;
        return h;
    },
    hexToRgb: function (hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    RGBtoHex: function (r, g, b) {
        this.hexString = "#" + this.unitConversion(r) + this.unitConversion(g) + this.unitConversion(b);
        return this.hexString;
    },
    hslToRgb: function (h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = this.hue2rgb(p, q, h + 1 / 3);
            g = this.hue2rgb(p, q, h);
            b = this.hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },
    rgbToHsl: function (r, g, b) {
        r /= 255, g /= 255, b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }

        return [Math.floor(h * 360), Math.floor(s * 100), Math.floor(l * 100)];
    }
};


(function ($) {
    "use strict";
    /**
     * @param {object} options Options
     */
    $.fn.colorpicker = function (options) {
        this.types = [
            'all',
            'hsv',
            'circle'
        ];
        this.defaultOptions = {
            type: 'all',
            colorValues: true,
            closeOn: 'change',
            onchange: function (color) {
            },
            onrender: function () {
            }
        };
        this.colorsampler = function (event, obj) {
            let rect = obj.getBoundingClientRect();
            let c = obj.getContext('2d');
            let x = event.pageX - rect.left;
            let y = event.pageY - rect.top;
            let p = c.getImageData(x, y, 1, 1).data;
            let colorCode;
            let r = p[0];
            let g = p[1];
            let b = p[2];
            let alpha = p[3];
            let a = Math.floor((100 * alpha) / 255) / 100;

            if (a <= 0) {
                colorCode = ((r << 16) | (g << 8) | b).toString(16);
            } else {
                colorCode = "rgba(" + r + "," + g + "," + b + "," + a + ")";
            }

            if (colorCode === "0") {
                colorCode = "transparent";
            }

            return colorCode;
        };
        this.colorselect = function (event) {
            let rect = canvasSelectHSV.getBoundingClientRect();
            let x = event.pageX - rect.left;
            let y = event.pageY - rect.top;
            let p = ctxSelectHSV.getImageData(x, y, 1, 1).data;
            let r = p[0];
            let g = p[1];
            let b = p[2];
            let alpha = p[3];
            let a = Math.floor((100 * alpha) / 255) / 100;
            return {
                rgba: [r, g, b, a],
                hsl: Convert.rgbToHsl(r, g, b),
                hex: Convert.RGBtoHex(r, g, b)
            };
        };
        this.generateHSV = function (hue) {
            for (let row = 0; row < canvasHSV.height; row++) {
                let percent = (row * 100) / canvasHSV.height;
                let grad = ctxHSV.createLinearGradient(0, 0, canvasHSV.width, 0);
                grad.addColorStop(0, 'hsl(' + hue + ', 0%, ' + (100 - percent) + '%)');
                grad.addColorStop(1, 'hsl(' + hue + ', 100%, ' + (100 - percent) + '%)');
                ctxHSV.fillStyle = grad;
                ctxHSV.fillRect(0, row, canvasHSV.width, 1);
            }
        };
        this.generateRangeHSV = function () {
            let gradient = ctxSelectHSV.createLinearGradient(0, 0, 0, canvasSelectHSV.height);

            gradient.addColorStop(0, "rgb(255, 0, 0)");
            gradient.addColorStop(0.15, "rgb(255, 0, 255)");
            gradient.addColorStop(0.33, "rgb(0, 0, 255)");
            gradient.addColorStop(0.49, "rgb(0, 255, 255)");
            gradient.addColorStop(0.67, "rgb(0, 255, 0)");
            gradient.addColorStop(0.84, "rgb(255, 255, 0)");
            gradient.addColorStop(1, "rgb(255, 0, 0)");

            ctxSelectHSV.fillStyle = gradient;

            ctxSelectHSV.fillRect(0, 0, canvasSelectHSV.width, canvasSelectHSV.height);
        };
        this.generateCircleColorpicker = function () {
            this.CX = canvasCircle.width / 2;
            this.CY = canvasCircle.height / 2;
            this.sx = this.CX;
            this.sy = this.CY;

            for (let i = 0; i < 360; i += 0.1) {
                let rad = i * (2 * Math.PI) / 360;
                ctxCircle.strokeStyle = "hsla(" + i + ", 100%, 50%, 1.0)";
                ctxCircle.beginPath();
                ctxCircle.moveTo(this.CX, this.CY);
                ctxCircle.lineTo(this.CX + this.sx * Math.cos(rad), this.CY + this.sy * Math.sin(rad));
                ctxCircle.stroke();
            }
        };
        this.render = function () {
            if ($('#colorpickerContainer').length) {
                $('#colorpickerContainer').remove();
            }
            $('body').append('<div id="colorpickerContainer"></div>');
            colorpickerContainer = $('#colorpickerContainer');

            if (this.defaultOptions.type === 'all') {
                let tabsHTML = '<div id="tabs">\n' +
                    '<ul>\n' +
                    '<li data-id="hsv" class="active">HSV</li>\n' +
                    '<li data-id="circle">Circle</li>\n' +
                    '</ul>\n' +
                    '</div>';
                colorpickerContainer.append(tabsHTML);
            }

            colorpickerContainer.append('<div id="pickers"></div>');

            if (this.defaultOptions.type === 'all' || this.defaultOptions.type === 'hsv') {
                let hsvHTML = '<div id="hsv" class="pickerContainer">\n' +
                    '<canvas id="colorpicker" width="300" height="300"></canvas>\n' +
                    '<div id="value">\n' +
                    '<canvas id="colorselect" width="30" height="300"></canvas>\n' +
                    '<div id="selectpreview"></div>\n' +
                    '</div>\n' +
                    '</div>';
                $('#pickers').append(hsvHTML);
            }

            if (this.defaultOptions.type === 'all' || this.defaultOptions.type === 'circle') {
                let circleHTML = '<div id="circle" class="pickerContainer">\n' +
                    '<canvas id="colorpickerCircle" width="300" height="300"></canvas>\n' +
                    '</div>';
                $('#pickers').append(circleHTML);
            }
            $('.pickerContainer').first().addClass('active');

            let previewHTML = '<div id="preview">\n' +
                '<div id="colorSelected"></div>\n' +
                '<div id="colorPreview"></div>\n' +
                '</div>';
            colorpickerContainer.append(previewHTML);

            if (this.defaultOptions.colorValues === true) {
                let colorsHTML = '<div id="colors">\n' +
                    '<p class="rgba">\n' +
                    '<span>RGBA:</span>\n' +
                    '<input type="text" value="">\n' +
                    '</p>\n' +
                    '<p class="hsl">\n' +
                    '<span>HSL:</span>\n' +
                    '<input type="text" value="">\n' +
                    '</p>\n' +
                    '<p class="hex">\n' +
                    '<span>HEX:</span>\n' +
                    '<input type="text" value="">\n' +
                    '</p>\n' +
                    '</div>';

                colorpickerContainer.append(colorsHTML);
            }
        };
        this.events = function () {
            let $this = this;

            $('#tabs ul li').click(function () {
                let id = $(this).data('id');
                $(this).parent().find('li').removeClass('active');
                $(this).addClass('active');
                $('.pickerContainer').removeClass('active');
                $('.pickerContainer#' + id).addClass('active');

            });

            if (this.defaultOptions.type === 'all' || this.defaultOptions.type === 'hsv') {
                $(canvasHSV).on('mousemove', function (e) {
                    $('#colorPreview').css('background', $this.colorsampler(e, this));
                }).on('click', function (e) {
                    $('#colorSelected').css('background', $this.colorsampler(e, this));
                    $this.defaultOptions.onchange();
                });
                $(canvasSelectHSV).on('mousedown', function (e) {
                    selectMusedown = true;
                    let rgba = $this.colorselect(e);
                    $this.generateHSV(rgba.hsl[0]);
                }).on('mouseup', function () {
                    selectMusedown = false;
                }).on('mousemove', function (e) {
                    let color = $this.colorselect(e);
                    if (selectMusedown) {
                        $this.generateHSV(color.hsl[0]);
                    }
                    let rect = this.getBoundingClientRect();
                    let y = event.pageY - rect.top;
                    $('#selectpreview').css({
                        top: y + 'px',
                        background: color.hex
                    });
                }).mouseleave(function (e) {
                    selectMusedown = false;
                });
            }
            if (this.defaultOptions.type === 'all' || this.defaultOptions.type === 'circle') {
                $(canvasCircle).on('mousemove', function (e) {
                    $('#colorPreview').css('background', $this.colorsampler(e, this));
                }).on('click', function (e) {
                    $('#colorSelected').css('background', $this.colorsampler(e, this));
                });
            }
        };
        this.init = function () {
            this.render();
            if (this.defaultOptions.type === 'all' || this.defaultOptions.type === 'hsv') {
                canvasHSV = $('#colorpicker')[0];
                canvasSelectHSV = $('#colorselect')[0];
                ctxHSV = canvasHSV.getContext('2d');
                ctxSelectHSV = canvasSelectHSV.getContext('2d');
            }
            if (this.defaultOptions.type === 'all' || this.defaultOptions.type === 'circle') {
                canvasCircle = $('#colorpickerCircle')[0];
                ctxCircle = canvasCircle.getContext('2d');

            }
            this.events();
            if (this.defaultOptions.type === 'all' || this.defaultOptions.type === 'hsv') {
                this.generateHSV(88);
                this.generateRangeHSV();
            }
            if (this.defaultOptions.type === 'all' || this.defaultOptions.type === 'circle') {
                this.generateCircleColorpicker();
            }
            this.defaultOptions.onrender();
        };

        if (typeof options !== 'object' && typeof options !== 'undefined') {
            throw new InvalidTypeError("param 'options' must be an Object not " + typeof options);
        }
        $.extend(this.defaultOptions, options);
        if (typeof this.defaultOptions.onchange !== 'function') {
            throw new InvalidTypeError("param 'options.onchange' must be a function not " + typeof this.defaultOptions.onchange);
        }
        if (typeof this.defaultOptions.onrender !== 'function') {
            throw new InvalidTypeError("param 'options.onrender' must be a function not " + typeof this.defaultOptions.onrender);
        }
        if ($.inArray(this.defaultOptions.type, this.types) < 0) {
            console.log($.inArray(this.defaultOptions.type, this.types))
            throw new InvalidValueError('invalid value for param options.type');
        }
        this.init();
        this.click(function () {
            colorpickerContainer.show();
        });
    }
})(jQuery);
$('button').colorpicker({
    type: 'circle'
});