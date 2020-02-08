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
    this.bytes = bytes;
    this.divName = divName;
    this.finalNibble = "";
}

{
    // dom

    Session.prototype.domElementUpdate = function() {
        var nibblesPerRow = 32*2;
        var bytesPerRow = nibblesPerRow / 2;

        if (this.domElement == null) {
            var divSession = document.createElement("div");
            var rowCount = 10;
            var textareaOffsets = document.createElement("textarea")
            textareaOffsets.cols = 4;
            textareaOffsets.rows = rowCount;
            textareaOffsets.disabled = true;
            textareaOffsets.style.resize = "none";
            textareaOffsets.style.fontFamily= "monospace";
            textareaOffsets.spellcheck = false;
            this.textareaOffsets = textareaOffsets;
            divSession.appendChild(textareaOffsets);

            var textareaHexadecimal = document.createElement("textarea");
            textareaHexadecimal.rows = rowCount;
            textareaHexadecimal.onkeyup = this.textareaHexadecimal_KeyUp.bind(this);
            textareaHexadecimal.oninput = this.textareaHexadecimal_Changed.bind(this);
            textareaHexadecimal.style.resize = "none";
            textareaHexadecimal.style.fontFamily= "monospace";
            textareaHexadecimal.spellcheck = false;
            this.textareaHexadecimal = textareaHexadecimal;
            divSession.appendChild(textareaHexadecimal);

            var textareaASCII = document.createElement("textarea");
            textareaASCII.cols = bytesPerRow - 1; // Not sure why -1 is needed.
            textareaASCII.rows = rowCount;
            textareaASCII.onkeyup = this.textareaASCII_KeyUp.bind(this);
            textareaASCII.onkeypress = this.textareaASCII_KeyPress.bind(this);
            textareaASCII.disabled = false;
            textareaASCII.style.background="lightgray";
            textareaASCII.style.fontFamily="monospace";
            textareaASCII.style.resize = "none";
            textareaASCII.spellcheck = false;
            this.textareaASCII = textareaASCII;
            divSession.appendChild(textareaASCII);

            var divMain = document.getElementById(this.divName);
            divMain.appendChild(divSession);

            this.domElement = divSession;
        }

        var textareaHexadecimalWidthInColumns = nibblesPerRow - 1; // Not sure why -1 is needed.
        if (this.textareaHexadecimal.scrollHeight > this.textareaHexadecimal.clientHeight) {
            var scrollbarWidthInChars = 2;  // May be 3 on some systems?
            textareaHexadecimalWidthInColumns += scrollbarWidthInChars;
        }
        this.textareaHexadecimal.cols = textareaHexadecimalWidthInColumns;

        var bytesAsStringHexadecimal = Converter.bytesToStringHexadecimal(this.bytes);
        this.textareaHexadecimal.value = bytesAsStringHexadecimal + this.finalNibble;

        var rowsVisible = this.textareaHexadecimal.rows;
        var rowHeightInPixels = this.textareaHexadecimal.offsetHeight / rowsVisible;
        var scrollOffsetInPixels = this.textareaHexadecimal.scrollTop;
        var scrollOffsetInRows = Math.round(scrollOffsetInPixels / rowHeightInPixels);
        var scrollOffsetInBytes = scrollOffsetInRows * bytesPerRow;
        var offsetsAsStrings = [];
        var bytesForRowsAsASCII = [];
        for (var i = 0; i < rowsVisible; i++) {
            var offsetForRow = scrollOffsetInBytes + (i * bytesPerRow);
            var offsetForRowAsHexadecimal = offsetForRow.toString(16)
            offsetsAsStrings.push(offsetForRowAsHexadecimal);

            var bytesForRow = this.bytes.slice(offsetForRow, offsetForRow + bytesPerRow);
            var bytesForRowAsASCII = Converter.bytesToStringASCII(bytesForRow)
            if (bytesForRowAsASCII!="") {
                bytesForRowsAsASCII.push(bytesForRowAsASCII);
            }
        }
        var offsetsAsString = offsetsAsStrings.join("\n");
        this.textareaOffsets.value = offsetsAsString;

        var bytesAsStringASCII = bytesForRowsAsASCII.join("\n");
        this.textareaASCII.value = bytesAsStringASCII;

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
    Session.prototype.textareaHexadecimal_Changed = function(event) {
        var bytesAsStringHexadecimal = event.target.value;
        this.bytes = Converter.stringHexadecimalToBytes( bytesAsStringHexadecimal);

        if (bytesAsStringHexadecimal.length % 2 == 0) {
            this.finalNibble = "";
        } else {
            this.finalNibble = bytesAsStringHexadecimal.substr ( bytesAsStringHexadecimal.length - 1, 1);

            var finalNibbleAsInt = parseInt(this.finalNibble, 16);
            if (isNaN(finalNibbleAsInt) == true) {
                this.finalNibble = "";
            }
        }

        this.domElementUpdate();
    }

    Session.prototype.textareaHexadecimal_KeyUp = function(event) {
        var keyName = event.key;
        if (keyName.startsWith("Arrow") || keyName == "Home" || keyName == "End") {
            this.domElementUpdate();
        }
    }

    Session.prototype.textareaASCII_KeyPress = function(event) {
        var key        = event.key;
        var hexKey     = key.charCodeAt(0).toString(16);
        var offset     = this.textareaASCII.selectionStart;
        var hexOffset  = 2*offset;
        var hexText    = this.textareaHexadecimal.value;
        var newHexText = [hexText.slice(0, hexOffset), hexKey, hexText.slice(hexOffset)].join('');
        this.bytes = Converter.stringHexadecimalToBytes( newHexText );
        this.domElementUpdate();
        this.textareaASCII.selectionStart = 1+offset;
        this.textareaASCII.selectionEnd   = 1+offset;
        return false; // prevent further event processing
    }

    Session.prototype.textareaASCII_KeyUp= function(event) {
        // FIXME: delete selected text
        var keyName = event.key;
        var oStart  = this.textareaASCII.selectionStart;
        var oEnd    = this.textareaASCII.selectionStart;
        if ( keyName.startsWith("Backspace") || keyName.startsWith("Delete") ) {
            prevBytesLeft  = this.bytes.slice(0,oStart);
            prevBytesRight = this.bytes.slice(1+oStart);
            newBytes = prevBytesLeft.concat(prevBytesRight);
            this.bytes = newBytes;
            this.domElementUpdate();
            this.textareaASCII.selectionStart = oStart;
            this.textareaASCII.selectionEnd   = oStart;
            return false; // prevent further event processing
        }
    }
}
