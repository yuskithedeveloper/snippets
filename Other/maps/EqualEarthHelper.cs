// Coordinates convertor for Equal Earth SVG maps.
// Scaling is based on https://equal-earth.com/ SVG maps size.
// Usage is free. No responsibility from my part. -->
// If you found this SVG map useful, please consider making a donation: https://buymeacoffee.com/yuskianywhere -->

using System.Drawing;

namespace YuskiTheDeveloper.EqualEarthMap
{
    public static class EqualEarthHelper
    {
        private const float A1 = 1.340264F;
        private const float A2 = -0.081106F;
        private const float A3 = 0.000893F;
        private const float A4 = 0.003796F;

        private const float FlorenceLongitudeDegrees = 11F;

        private const float SVGWidth = 1117.39F;
        private const float SVGHeight = 544.06F;

        private const float XMax = 2.706630F;
        private const float YMax = 1.317363F;

        public static PointF GetPointDegrees(float latitudeDegrees, float longitudeDegrees)
        {
            var latitudeRadians = GetRadians(latitudeDegrees);
            var longitudeRadians = GetRadians(longitudeDegrees);
            return GetPointRadians(latitudeRadians, longitudeRadians);
        }

        public static PointF GetPointRadians(float latituteRadians, float longitudeRadians)
        {
            longitudeRadians -= GetRadians(FlorenceLongitudeDegrees);
            if (longitudeRadians < -Math.PI)
            {
                longitudeRadians += (float)(2 * Math.PI);
            }

            var notScaledPoint = GetPointInternal(latituteRadians, longitudeRadians);
            var result = ScaleToSvg(notScaledPoint);
            return result;
        }

        private static PointF GetPointInternal(float latituteRadians, float longitudeRadians)
        {
            var sinTheta = Math.Sqrt(3) / 2 * Math.Sin(latituteRadians);
            var theta = Math.Asin(sinTheta);

            var x = (2 * Math.Sqrt(3) * longitudeRadians * Math.Cos(theta)) / (3 * (A1 + 3 * A2 * Math.Pow(theta, 2) + Math.Pow(theta, 6) * (7 * A3 + 9 * A4 * Math.Pow(theta, 2))));
            var y = theta * (A1 + A2 * Math.Pow(theta, 2) + Math.Pow(theta, 6) * (A3 + A4 * Math.Pow(theta, 2)));

            return new PointF((float)x, (float)y);
        }

        private static PointF ScaleToSvg(PointF notScaledPoint)
        {
            var result = new PointF((float)((notScaledPoint.X + XMax) * (SVGWidth / (XMax * 2))), (float)((-(notScaledPoint.Y - YMax)) * (SVGHeight / (YMax * 2))));
            return result;
        }

        private static float GetRadians(float degrees)
        {
            return (float)(Math.PI * degrees / 180.0F);
        }
    }
}
