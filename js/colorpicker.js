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

var guid = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
};

var Convert = {
    unitConversion: function (unit) {
        var hexconv = unit.toString(16);
        return hexconv.length === 1 ? '0' + hexconv : hexconv;
    },
    hue2rgb: function (h, u, e) {
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
        var $this = this;
        this.colorpickerContainer = null;
        this.canvasSelectHSV = null;
        this.canvasHSV = null;
        this.canvasCircle = null;
        this.ctxHSV = null;
        this.ctxSelectHSV = null;
        this.ctxCircle = null;
        this.selectMusedown = false;
        this.selectedColor = null;
        this.defaultOptions = {
            colorValues: true,
            closeOn: 'change',
            onChange: function (color) {},
            onRender: function () {},
            onShow: function () {},
            onHide: function () {},
            onSelect: function (color) {}
        };
        this.hide = function () {
            $this.colorpickerContainer.hide();
            this.defaultOptions.onHide();
        };
        this.show = function () {
            this.init(function () {
                $this.colorpickerContainer.show();
                $this.defaultOptions.onShow();
            });
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

            if (a >= 0) {
                colorCode = Convert.RGBtoHex(r, g, b);
            } else {
                colorCode = "rgba(" + r + "," + g + "," + b + "," + a + ")";
            }

            if (colorCode === "0") {
                colorCode = "transparent";
            }

            return colorCode;
        };
        this.colorselect = function (event) {
            let rect = $this.canvasSelectHSV.getBoundingClientRect();
            let x = event.pageX - rect.left;
            let y = event.pageY - rect.top;
            let p = $this.ctxSelectHSV.getImageData(x, y, 1, 1).data;
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
            for (let row = 0; row < $this.canvasHSV.height; row++) {
                let percent = (row * 100) / $this.canvasHSV.height;
                let grad = $this.ctxHSV.createLinearGradient(0, 0, $this.canvasHSV.width, 0);
                grad.addColorStop(0, 'hsl(' + hue + ', 0%, ' + (100 - percent) + '%)');
                grad.addColorStop(1, 'hsl(' + hue + ', 100%, ' + (100 - percent) + '%)');
                $this.ctxHSV.fillStyle = grad;
                $this.ctxHSV.fillRect(0, row, $this.canvasHSV.width, 1);
            }
        };
        this.generateRangeHSV = function () {
            let gradient = $this.ctxSelectHSV.createLinearGradient(0, 0, 0, $this.canvasSelectHSV.height);

            gradient.addColorStop(0, "rgb(255, 0, 0)");
            gradient.addColorStop(0.15, "rgb(255, 0, 255)");
            gradient.addColorStop(0.33, "rgb(0, 0, 255)");
            gradient.addColorStop(0.49, "rgb(0, 255, 255)");
            gradient.addColorStop(0.67, "rgb(0, 255, 0)");
            gradient.addColorStop(0.84, "rgb(255, 255, 0)");
            gradient.addColorStop(1, "rgb(255, 0, 0)");

            $this.ctxSelectHSV.fillStyle = gradient;

            $this.ctxSelectHSV.fillRect(0, 0, $this.canvasSelectHSV.width, $this.canvasSelectHSV.height);
        };
        this.generateCircleColorpicker = function () {
            this.CX = $this.canvasCircle.width / 2;
            this.CY = $this.canvasCircle.height / 2;
            this.sx = this.CX;
            this.sy = this.CY;

            for (let i = 0; i < 360; i += 0.1) {
                let rad = i * (2 * Math.PI) / 360;
                $this.ctxCircle.strokeStyle = "hsla(" + i + ", 100%, 50%, 1.0)";
                $this.ctxCircle.beginPath();
                $this.ctxCircle.moveTo(this.CX, this.CY);
                $this.ctxCircle.lineTo(this.CX + this.sx * Math.cos(rad), this.CY + this.sy * Math.sin(rad));
                $this.ctxCircle.stroke();
            }
        };
        this.render = function () {
            let gid = guid();
            if ($('.colorpickerContainer[data-id=' + gid + ']').length) {
                $('.colorpickerContainer[data-id=' + gid + ']').remove();
            }
            $('body').append('<div class="colorpickerContainer" data-id="' + gid + '"></div>');
            $this.colorpickerContainer = $('.colorpickerContainer[data-id=' + gid + ']');

            let tabsHTML = `
                        <div class="tabs">
                            <ul>
                                <li data-id="hsv" class="active">HSV</li>
                                <li data-id="circle">Circle</li>
                            </ul>
                        </div>`;
            $this.colorpickerContainer.append(tabsHTML);

            $this.colorpickerContainer.append('<div class="pickers"></div>');

            let hsvHTML = `
                        <div data-id="hsv" class="pickerContainer">
                            <canvas class="colorpicker" width="300" height="300"></canvas>
                            <div class="value">
                                <canvas class="colorselect" width="30" height="300"></canvas>
                                <div class="selectpreview"></div>
                            </div>
                        </div>`;
            $this.colorpickerContainer.find('.pickers').append(hsvHTML);

            let circleHTML = `
                        <div data-id="circle" class="pickerContainer">
                            <canvas class="colorpickerCircle" width="300" height="300"></canvas>
                        </div>`;
            $this.colorpickerContainer.find('.pickers').append(circleHTML);

            $this.colorpickerContainer.find('.pickerContainer').first().addClass('active');

            let previewHTML = `
                    <div class="preview">
                        <div class="colorSelected"></div>
                        <div class="colorPreview"></div>
                    </div>`;
            $this.colorpickerContainer.append(previewHTML);

            if (this.defaultOptions.colorValues === true) {
                let colorsHTML = `
                        <div class="colors">
                            <p class="rgba">
                                <span>RGBA:</span>
                                <input type="text" value="">
                            </p>
                            <p class="hsl">
                                <span>HSL:</span>
                                <input type="text" value="">
                            </p>
                            <p class="hex">
                                <span>HEX:</span>
                                <input type="text" value="">
                            </p>
                        </div>`;

                $this.colorpickerContainer.append(colorsHTML);
            }
        };
        this.events = function () {
            $this.colorpickerContainer.find('.tabs ul li').click(function () {
                let id = $(this).data('id');
                $(this).parent().find('li').removeClass('active');
                $(this).addClass('active');
                $('.pickerContainer').removeClass('active');
                $('.pickerContainer[data-id=' + id + ']').addClass('active');

            });

            $($this.canvasHSV).on('mousemove', function (e) {
                $this.colorpickerContainer.find('.colorPreview').css('background', $this.colorsampler(e, this));
            }).on('click', function (e) {
                $this.colorpickerContainer.find('.colorSelected').css('background', $this.colorsampler(e, this));
                let color = $this.colorsampler(e, this);
                $this.defaultOptions.onChange(color);
            });
            $($this.canvasSelectHSV).on('mousedown', function (e) {
                $this.selectMusedown = true;
                let rgba = $this.colorselect(e);
                $this.generateHSV(rgba.hsl[0]);
            }).on('mouseup', function () {
                $this.selectMusedown = false;
            }).on('mousemove', function (e) {
                let color = $this.colorselect(e);
                if ($this.selectMusedown) {
                    $this.generateHSV(color.hsl[0]);
                }
                let rect = this.getBoundingClientRect();
                let y = event.pageY - rect.top;
                $this.colorpickerContainer.find('.selectpreview').css({
                    top: y + 'px',
                    background: color.hex
                });
            }).mouseleave(function (e) {
                $this.selectMusedown = false;
            });

            $($this.canvasCircle).on('mousemove', function (e) {
                $this.colorpickerContainer.find('.colorPreview').css('background', $this.colorsampler(e, this));
            }).on('click', function (e) {
                $this.colorpickerContainer.find('.colorSelected').css('background', $this.colorsampler(e, this));
                let color = $this.colorsampler(e, this);
                $this.defaultOptions.onChange(color);
            });
        };
        this.init = function (callback) {
            this.render();
            $this.canvasHSV = $this.colorpickerContainer.find('.colorpicker')[0];
            $this.canvasSelectHSV = $this.colorpickerContainer.find('.colorselect')[0];
            $this.ctxHSV = $this.canvasHSV.getContext('2d');
            $this.ctxSelectHSV = $this.canvasSelectHSV.getContext('2d');

            $this.canvasCircle = $this.colorpickerContainer.find('.colorpickerCircle')[0];
            $this.ctxCircle = $this.canvasCircle.getContext('2d');

            this.events();

            this.generateHSV(88);
            this.generateRangeHSV();

            this.generateCircleColorpicker();

            this.defaultOptions.onRender();
            callback();
        };

        if (typeof options !== 'object' && typeof options !== 'undefined') {
            throw new InvalidTypeError("param 'options' must be an Object not " + typeof options);
        }
        $.extend(this.defaultOptions, options);
        if (typeof this.defaultOptions.onChange !== 'function') {
            throw new InvalidTypeError("param 'options.onChange' must be a function not " + typeof this.defaultOptions.onChange);
        }
        if (typeof this.defaultOptions.onRender !== 'function') {
            throw new InvalidTypeError("param 'options.onRender' must be a function not " + typeof this.defaultOptions.onRender);
        }
//        this.init();
        this.click(function () {
            $this.show();
        });
    };
})(jQuery);