'use strict';

module.exports = {
    Simple: require('./simple'),
    SpatialHash: require('./spatial-hash')
};

if (PIXI) {
    PIXI.extras.Cull = {
        Simple: require('./simple'),
        SpatialHash: require('./spatial-hash')
    };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2NvZGUvaW5kZXguanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIlNpbXBsZSIsInJlcXVpcmUiLCJTcGF0aWFsSGFzaCIsIlBJWEkiLCJleHRyYXMiLCJDdWxsIl0sIm1hcHBpbmdzIjoiOztBQUFBQSxPQUFPQyxPQUFQLEdBQWlCO0FBQ2JDLFlBQVFDLFFBQVEsVUFBUixDQURLO0FBRWJDLGlCQUFhRCxRQUFRLGdCQUFSO0FBRkEsQ0FBakI7O0FBS0EsSUFBSUUsSUFBSixFQUNBO0FBQ0lBLFNBQUtDLE1BQUwsQ0FBWUMsSUFBWixHQUFtQjtBQUNmTCxnQkFBUUMsUUFBUSxVQUFSLENBRE87QUFFZkMscUJBQWFELFFBQVEsZ0JBQVI7QUFGRSxLQUFuQjtBQUlIIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBTaW1wbGU6IHJlcXVpcmUoJy4vc2ltcGxlJyksXHJcbiAgICBTcGF0aWFsSGFzaDogcmVxdWlyZSgnLi9zcGF0aWFsLWhhc2gnKVxyXG59XHJcblxyXG5pZiAoUElYSSlcclxue1xyXG4gICAgUElYSS5leHRyYXMuQ3VsbCA9IHtcclxuICAgICAgICBTaW1wbGU6IHJlcXVpcmUoJy4vc2ltcGxlJyksXHJcbiAgICAgICAgU3BhdGlhbEhhc2g6IHJlcXVpcmUoJy4vc3BhdGlhbC1oYXNoJylcclxuICAgIH1cclxufSJdfQ==