/*
 * MIT License
 * 
 * Copyright (c) 2017 This Could Be Better
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Changes by:
 *   2020, Tiago Gasiba, tiago.gasiba@gmail.com
 */

function Session(divName,bytes) {
    // Class Variables
    this.bytes         = bytes;
    this.divName       = divName;
    this.finalNibble   = "";
    this.domElement    = null;  // our DOM element
    this.taOffsets     = null;  // Text Area with offsets
    this.taHex         = null;  // Text Area with hexadecimal values
    this.taASCII       = null;  // Text Area with ASCII characters
    this.nibblesPerRow = 32;
    this.bytesPerRow   = this.nibblesPerRow * 2;
}

{
    // Create DOM Elements
    Session.prototype.createDOMElements = function() {
        var divSession             = document.createElement("div");
        var rowCount               = 10;
        var taOffsets              = document.createElement("textarea")
        taOffsets.cols             = 4;
        taOffsets.rows             = rowCount;
        taOffsets.disabled         = true;
        taOffsets.style.resize     = "none";
        taOffsets.style.fontFamily = "monospace";
        taOffsets.style.height     = "158px";
        taOffsets.spellcheck       = false;
        this.taOffsets             = taOffsets;
        divSession.appendChild(taOffsets);

        var taHex              = document.createElement("textarea");
        taHex.rows             = rowCount;
        taHex.onkeyup          = this.taHex_KeyUp.bind(this);
        taHex.oninput          = this.taHex_Changed.bind(this);
        taHex.style.resize     = "none";
        taHex.style.fontFamily = "monospace";
        taHex.style.height     = "158px";
        taHex.spellcheck       = false;
        this.taHex             = taHex;
        divSession.appendChild(taHex);

        var taASCII              = document.createElement("textarea");
        taASCII.cols             = this.bytesPerRow - 1; // Not sure why -1 is needed.
        taASCII.onkeyup          = this.taASCII_KeyUp.bind(this);
        taASCII.onkeypress       = this.taASCII_KeyPress.bind(this); taASCII.disabled = false;
        taASCII.style.background ="lightgray";
        taASCII.style.fontFamily ="monospace";
        taASCII.style.resize     = "none";
        taASCII.style.height     = "158px";
        taASCII.spellcheck       = false;
        this.taASCII             = taASCII;
        divSession.appendChild(taASCII);

        var divMain = document.getElementById(this.divName);
        divMain.appendChild(divSession);

        this.domElement = divSession;
        return this.domElement;
    }

    // Update DOM Elements
    Session.prototype.domElementUpdate = function() {

        if (this.domElement == null) {
            this.createDOMElements();
        }

        var taHexWidthInColumns = this.nibblesPerRow - 1; // Not sure why -1 is needed.
        if (this.taHex.scrollHeight > this.taHex.clientHeight) {
            var scrollbarWidthInChars = 2;  // May be 3 on some systems?
            taHexWidthInColumns += scrollbarWidthInChars;
        }
        this.taHex.cols = taHexWidthInColumns;

        var bytesAsStringHexadecimal = Converter.bytesToStringHexadecimal(this.bytes);
        this.taHex.value = bytesAsStringHexadecimal + this.finalNibble;

        var rowsVisible = this.taHex.rows;
        var rowHeightInPixels = this.taHex.offsetHeight / rowsVisible;
        var scrollOffsetInPixels = this.taHex.scrollTop;
        var scrollOffsetInRows = Math.round(scrollOffsetInPixels / rowHeightInPixels);
        var scrollOffsetInBytes = scrollOffsetInRows * this.bytesPerRow;
        var offsetsAsStrings = [];
        var bytesForRowsAsASCII = [];
        for (var i = 0; i < rowsVisible; i++) {
            var offsetForRow = scrollOffsetInBytes + (i * this.bytesPerRow);
            var offsetForRowAsHexadecimal = offsetForRow.toString(16)
            var L = offsetForRowAsHexadecimal.length;
            for (var j=0; j<5-L; j++) {
                offsetForRowAsHexadecimal = "0".concat(offsetForRowAsHexadecimal);
            }
            offsetsAsStrings.push(offsetForRowAsHexadecimal);
        }
        var bytesForRow = this.bytes;
        var bytesForRowAsASCII = Converter.bytesToStringASCII(bytesForRow)
        if (bytesForRowAsASCII!="") {
            bytesForRowsAsASCII.push(bytesForRowAsASCII);
        }
        var offsetsAsString = offsetsAsStrings.join("\n");
        this.taOffsets.value = offsetsAsString;

        var bytesAsStringASCII = bytesForRowsAsASCII.join("");
        this.taASCII.value = bytesAsStringASCII;

        return this.domElement;
    }


    Session.prototype.loadBytes = function(dataAsBinaryString) {
        this.bytes = [];

        for (var i = 0; i < dataAsBinaryString.length; i++) {
            var byte = dataAsBinaryString.charCodeAt(i);
            this.bytes.push(byte);
        }

        this.domElementUpdate();
    }

    /////////////////////////////////
    //          events             //
    /////////////////////////////////
    Session.prototype.taHex_Changed = function(event) {
        var bytesAsStringHexadecimal = event.target.value;
        this.bytes = Converter.stringHexadecimalToBytes( bytesAsStringHexadecimal);

        if (bytesAsStringHexadecimal.length % 2 == 0) {
            this.finalNibble = "";
        } else {
            this.finalNibble = bytesAsStringHexadecimal.substr( bytesAsStringHexadecimal.length - 1, 1);

            var finalNibbleAsInt = parseInt(this.finalNibble, 16);
            if (isNaN(finalNibbleAsInt) == true) {
                this.finalNibble = "";
            }
        }
        this.domElementUpdate();
    }

    Session.prototype.taHex_KeyUp = function(event) {
        // FIXME: try to synch scroll left/right
        //var keyName = event.key;
        //if (keyName.startsWith("Arrow") || keyName == "Home" || keyName == "End") {
        //    this.domElementUpdate();
        //}
    }

    Session.prototype.taASCII_KeyPress = function(event) {
        var key       = event.key;
        var offset    = this.taASCII.selectionStart;
        var hexOffset = 2*offset;
        var hexText   = this.taHex.value;
        var updateDom = false;
        var hexKey;

        if (key.length==1) {
            hexKey = key.charCodeAt(0).toString(16);
            updateDom = true;
        }
        if (key=="Enter") {
            hexKey = "\n".charCodeAt(0).toString(16);
            updateDom = true;
        }
        if (updateDom==true) {
            if (hexKey.length==1) {
                hexKey = "0".concat(hexKey);
            }
            var newHexText = [hexText.slice(0, hexOffset), hexKey, hexText.slice(hexOffset)].join('');
            this.bytes     = Converter.stringHexadecimalToBytes( newHexText );
            this.domElementUpdate();
            this.taASCII.selectionStart = 1+offset;
            this.taASCII.selectionEnd   = 1+offset;
        }
        return false; // prevent further event processing
    }

    Session.prototype.taASCII_KeyUp= function(event) {
        // FIXME: delete selected text
        var keyName = event.key;
        var oStart  = this.taASCII.selectionStart;
        var oEnd    = this.taASCII.selectionStart;
        if ( keyName.startsWith("Backspace") || keyName.startsWith("Delete") ) {
            prevBytesLeft  = this.bytes.slice(0,oStart);
            prevBytesRight = this.bytes.slice(1+oStart);
            newBytes = prevBytesLeft.concat(prevBytesRight);
            this.bytes = newBytes;
            this.domElementUpdate();
            this.taASCII.selectionStart = oStart;
            this.taASCII.selectionEnd   = oStart;
            return false; // prevent further event processing
        }
    }
}
