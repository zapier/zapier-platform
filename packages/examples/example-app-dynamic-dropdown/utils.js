// Some handy stuff that's used in various places

var generateID = function(urlString) {
    var pieces = urlString.split('/').reverse();
    // go through the pieces, and only keep the number/integers
    var numbers = pieces.filter( (piece) => {
        if (Number.isInteger(piece)) {
            // it's a typeof number, and is an integer
            return true;
        }
        
        if (Number.isInteger(Number.parseInt(piece, 10)) ) {
            // we're able to parse this into a number/integer
            return true;
        }
        
        return false;
    });
    return numbers[0];
}; 

module.exports.generateID = generateID;