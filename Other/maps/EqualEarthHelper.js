if (!window.EqualEarthHelper) {
    window.EqualEarthHelper = {
        create: function () {
            const A1 = 1.340264;
            const A2 = -0.081106;
            const A3 = 0.000893;
            const A4 = 0.003796;

            const FlorenceLongitudeDegrees = 11;

            const SVGWidth = 1117.39;
            const SVGHeight = 544.06;

            const XMax = 2.706630;
            const YMax = 1.317363;

            function getPointDegrees(latitudeDegrees, longitudeDegrees) {
                const latitudeRadians = _getRadians(latitudeDegrees);
                const longitudeRadians = _getRadians(longitudeDegrees);
                return getPointRadians(latitudeRadians, longitudeRadians);
            }

            function getPointRadians(latituteRadians, longitudeRadians) {
                longitudeRadians -= _getRadians(FlorenceLongitudeDegrees);
                if (longitudeRadians < -Math.PI) {
                    longitudeRadians += 2 * Math.PI;
                }

                const notScaledPoint = _getPointInternal(latituteRadians, longitudeRadians);
                const result = _scaleToSvg(notScaledPoint);
                return result;
            }

            function _getPointInternal(latituteRadians, longitudeRadians) {
                const sinTheta = Math.sqrt(3) / 2 * Math.sin(latituteRadians);
                const theta = Math.asin(sinTheta);

                const x = (2 * Math.sqrt(3) * longitudeRadians * Math.cos(theta)) / (3 * (A1 + 3 * A2 * Math.pow(theta, 2) + Math.pow(theta, 6) * (7 * A3 + 9 * A4 * Math.pow(theta, 2))));
                const y = theta * (A1 + A2 * Math.pow(theta, 2) + Math.pow(theta, 6) * (A3 + A4 * Math.pow(theta, 2)));

                return { x: x, y: y };
            }

            function _scaleToSvg(notScaledPoint) {
                const x = (notScaledPoint.x + XMax) * (SVGWidth / (XMax * 2));
                const y = (-(notScaledPoint.y - YMax)) * (SVGHeight / (YMax * 2));
                return { x: x, y: y };
            }

            function _getRadians(degrees) {
                return Math.PI * degrees / 180;
            }

            return { getPointDegrees: getPointDegrees, getPointRadians: getPointRadians };
        }
    }
}