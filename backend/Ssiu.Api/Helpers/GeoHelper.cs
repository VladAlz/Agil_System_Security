using System.Collections.Generic;
using System.Text.Json;

namespace Ssiu.Api.Helpers
{
    public class Coordinate
    {
        public double Lat { get; set; }
        public double Lng { get; set; }
    }

    public static class GeoHelper
    {
        public static bool IsPointInPolygon(double lat, double lng, string polygonJson)
        {
            var polygon = JsonSerializer.Deserialize<List<Coordinate>>(polygonJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (polygon == null || polygon.Count < 3) return false;

            bool isInside = false;
            int n = polygon.Count;

            for (int i = 0, j = n - 1; i < n; j = i++)
            {
                if (((polygon[i].Lat > lat) != (polygon[j].Lat > lat)) &&
                    (lng < (polygon[j].Lng - polygon[i].Lng) * (lat - polygon[i].Lat) / (polygon[j].Lat - polygon[i].Lat) + polygon[i].Lng))
                {
                    isInside = !isInside;
                }
            }

            return isInside;
        }
    }
}
