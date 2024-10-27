//=====================================================================================================
//                     DISASTER RECOVERY MONITORING USING THE STANDARD VEGETATION INDEX (SVI)
//=====================================================================================================
//The Standardized Vegetation Index (SVI) developed by Peters et al. (2002) describes the probability 
//of variation from the normal Enhanced Vegetation Index (EVI) over multiple years of data, on a weekly
//(or 16 day) time step. The EVI images are level 3 products based on data captured by MODIS. The SVI is  
//calculated by taking the EVI of the pixel i during week j for year k
//minus the mean for pixel i during week j over n years, 
//divided by standard deviation of pixel i during week j over n years. Please visit
//http://www.un-spider.org/advisory-support/recommended-practices/recommended-practice-agricultural-drought-monitoring-svi
//for more information about the SVI.
//This script uses the Quality Bit-Mask in order to mask out clouds or low quality pixels. 
//=====================================================================================================

//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//                                    RUN THE CASE STUDY OF BRUMADINHO

// If you would like to run the  case study of Brumadinho you can use the predefined 
// geometry below as well as the other predefined parameter settings. The code will take you
// to Brumadinho, Brazil.
// --> Remove the comment-symbol (//) below to so Earth Engine recognizes the polygon.

//var AOI = ee.FeatureCollection(ee.Geometry.Polygon([[[ -44.121435338508107, -20.117511492969005 ], [ -44.120896116460308, -20.117037631169435 ], [ -44.119049689448175, -20.116498409121633 ], [ -44.117677124235612, -20.116906910672995 ], [ -44.116239198774835, -20.118214115637343 ], [ -44.115275135113627, -20.11958668084991 ], [ -44.115961417719909, -20.120403683952627 ], [ -44.116647700326183, -20.120420024014667 ], [ -44.117464703428908, -20.121204346993292 ], [ -44.1184577, -20.1211346 ], [ -44.1186804, -20.1212771 ], [ -44.1190232, -20.1214483 ], [ -44.1193271, -20.1216164 ], [ -44.1195242, -20.1218195 ], [ -44.1198067, -20.1221312 ], [ -44.1200999, -20.122290599999989 ], [ -44.1204704, -20.1223341 ], [ -44.1211186, -20.1226602 ], [ -44.1213038, -20.1228341 ], [ -44.121736, -20.1228051 ], [ -44.1219829, -20.122979 ], [ -44.1220524, -20.123479 ], [ -44.1220061, -20.1238413 ], [ -44.1216048, -20.1242833 ], [ -44.1212652, -20.1248485 ], [ -44.1212112, -20.1253485 ], [ -44.1209025, -20.1254427 ], [ -44.1208022, -20.1258485 ], [ -44.1204626, -20.1260441 ], [ -44.1198067, -20.1267107 ], [ -44.1195674, -20.1267325 ], [ -44.1191353, -20.1265731 ], [ -44.118255499999989, -20.1265658 ], [ -44.1175854, -20.126483499999985 ], [ -44.1174755, -20.1265737 ], [ -44.1174299, -20.126672 ], [ -44.1174245, -20.1267601 ], [ -44.1174245, -20.1268986 ], [ -44.1175854, -20.1270976 ], [ -44.1178215, -20.127193300000012 ], [ -44.1180468, -20.1273494 ], [ -44.11858320000001, -20.1276113 ], [ -44.1191507, -20.1280585 ], [ -44.1193668, -20.1287686 ], [ -44.1195829, -20.1294352 ], [ -44.1196755, -20.1299569 ], [ -44.1197372, -20.1302902 ], [ -44.1196446, -20.1307829 ], [ -44.1188729, -20.1313625 ], [ -44.1188729, -20.1317683 ], [ -44.1184545, -20.1320134 ], [ -44.1180897, -20.1325775 ], [ -44.1178851, -20.1328841 ], [ -44.1177924, -20.13318 ], [ -44.1176392, -20.1334134 ], [ -44.116959, -20.1335073 ], [ -44.1166788, -20.1335093 ], [ -44.1165276, -20.1333314 ], [ -44.116388, -20.133217399999985 ], [ -44.1161935, -20.1322536 ], [ -44.1153743, -20.1313777 ], [ -44.1147943, -20.1301977 ], [ -44.1142702, -20.1300592 ], [ -44.1146135, -20.1303413 ], [ -44.1149876, -20.1319093 ], [ -44.1154986, -20.1332189 ], [ -44.1155262, -20.1336209 ], [ -44.1151533, -20.1338154 ], [ -44.1144741, -20.1338468 ], [ -44.1141629, -20.1340583 ], [ -44.1138035, -20.1339878 ], [ -44.1137016, -20.134154 ], [ -44.1139518, -20.1342303 ], [ -44.1141254, -20.1347382 ], [ -44.1140395, -20.1349901 ], [ -44.1137123, -20.135116 ], [ -44.1140556, -20.135257 ], [ -44.1141307, -20.1354988 ], [ -44.1143131, -20.1359621 ], [ -44.1144955, -20.1362341 ], [ -44.1149998, -20.136214 ], [ -44.1152633, -20.13644 ], [ -44.1153107, -20.1367014 ], [ -44.1152249, -20.1373662 ], [ -44.1154072, -20.1373965 ], [ -44.1155896, -20.1372554 ], [ -44.1154928, -20.1367098 ], [ -44.1158169, -20.1364634 ], [ -44.1166198, -20.1364859 ], [ -44.1172528, -20.1368586 ], [ -44.1179623, -20.1370866 ], [ -44.1185025, -20.1374633 ], [ -44.1189809, -20.1380864 ], [ -44.1189964, -20.1384052 ], [ -44.1188299, -20.138799 ], [ -44.1185778, -20.1388732 ], [ -44.1182092, -20.1386805 ], [ -44.1179777, -20.1388255 ], [ -44.1181475, -20.1394051 ], [ -44.1180146, -20.1399309 ], [ -44.1166658, -20.1412454 ], [ -44.1167893, -20.1414338 ], [ -44.1179293, -20.1415693 ], [ -44.1181784, -20.1419699 ], [ -44.118255499999989, -20.1432668 ], [ -44.1185719, -20.1434624 ], [ -44.1186723, -20.1433175 ], [ -44.1185025, -20.1430857 ], [ -44.1189373, -20.1416835 ], [ -44.119345, -20.1419253 ], [ -44.1195059, -20.1418145 ], [ -44.1191733, -20.1413411 ], [ -44.1197108, -20.1403894 ], [ -44.1201848, -20.1401151 ], [ -44.1204781, -20.1397384 ], [ -44.1210492, -20.1394341 ], [ -44.1215739, -20.1395065 ], [ -44.1216357, -20.1397818 ], [ -44.1209102, -20.1405064 ], [ -44.1212266, -20.1407745 ], [ -44.1217134, -20.1404931 ], [ -44.1218169, -20.1405644 ], [ -44.1216357, -20.1408759 ], [ -44.1219058, -20.1409556 ], [ -44.1223487, -20.1404931 ], [ -44.1229553, -20.1404267 ], [ -44.123696099999989, -20.1404991 ], [ -44.1240589, -20.1409266 ], [ -44.1247457, -20.1411874 ], [ -44.1249155, -20.1415425 ], [ -44.125147, -20.1415932 ], [ -44.1254171, -20.141412 ], [ -44.1257489, -20.1414555 ], [ -44.1259573, -20.1418033 ], [ -44.1258338, -20.1421873 ], [ -44.125911, -20.1424626 ], [ -44.12632, -20.1427017 ], [ -44.1269141, -20.1430005 ], [ -44.1272011, -20.1430836 ], [ -44.1274506, -20.143181799999986 ], [ -44.1277939, -20.1432322 ], [ -44.128215, -20.1433304 ], [ -44.128502, -20.1432926 ], [ -44.1293174, -20.1429754 ], [ -44.1299155, -20.1427991 ], [ -44.1300979, -20.1426455 ], [ -44.1301623, -20.142439 ], [ -44.1302133, -20.1423483 ], [ -44.1300416, -20.1422375 ], [ -44.1304064, -20.1418044 ], [ -44.1309696, -20.1414619 ], [ -44.1316509, -20.1410892 ], [ -44.1323376, -20.1408676 ], [ -44.1327775, -20.1405554 ], [ -44.1333889, -20.1405788 ], [ -44.1336359, -20.1407237 ], [ -44.1341375, -20.1405499 ], [ -44.1352987, -20.1396488 ], [ -44.1354494, -20.1392602 ], [ -44.1361249, -20.1389286 ], [ -44.1364306, -20.1384955 ], [ -44.1367768, -20.1384704 ], [ -44.136892, -20.1381631 ], [ -44.136731, -20.1378861 ], [ -44.1368651, -20.1376342 ], [ -44.1376488, -20.1370503 ], [ -44.1380024, -20.1369291 ], [ -44.1382739, -20.1367605 ], [ -44.1386998, -20.1367126 ], [ -44.1395474, -20.1363751 ], [ -44.1397888, -20.1363751 ], [ -44.1402286, -20.1362038 ], [ -44.1406739, -20.1360578 ], [ -44.141124499999989, -20.136088 ], [ -44.1414678, -20.1362542 ], [ -44.1417736, -20.1368335 ], [ -44.1417736, -20.1375335 ], [ -44.1422564, -20.1373673 ], [ -44.1421706, -20.1369392 ], [ -44.1423851, -20.1368486 ], [ -44.1426319, -20.137055 ], [ -44.1427606, -20.1370399 ], [ -44.1425461, -20.1365967 ], [ -44.142766, -20.136616899999989 ], [ -44.1429806, -20.1370601 ], [ -44.1437101, -20.137299399999989 ], [ -44.1439703, -20.1376292 ], [ -44.1439676, -20.1380271 ], [ -44.1437209, -20.138289 ], [ -44.1429162, -20.1389437 ], [ -44.1426695, -20.1396287 ], [ -44.1425836, -20.1399006 ], [ -44.1421652, -20.1401424 ], [ -44.1421866, -20.1403187 ], [ -44.1425729, -20.1404748 ], [ -44.1424292, -20.141271 ], [ -44.1420702, -20.1415952 ], [ -44.1423326, -20.1427103 ], [ -44.1422497, -20.1432808 ], [ -44.1427331, -20.1438513 ], [ -44.1430431, -20.1446072 ], [ -44.1434444, -20.1449622 ], [ -44.1436991, -20.1450998 ], [ -44.1437531, -20.1453389 ], [ -44.1435448, -20.1461649 ], [ -44.1432747, -20.1468386 ], [ -44.1433518, -20.1470125 ], [ -44.1432515, -20.1471719 ], [ -44.1432438, -20.1472444 ], [ -44.1434059, -20.1473096 ], [ -44.143375, -20.1475486 ], [ -44.1435139, -20.1477877 ], [ -44.1435371, -20.1479978 ], [ -44.1435756, -20.148063 ], [ -44.1437531, -20.1478602 ], [ -44.1442856, -20.1480848 ], [ -44.144548, -20.1486789 ], [ -44.1448567, -20.1487875 ], [ -44.1451223, -20.1489208 ], [ -44.1451499, -20.1491498 ], [ -44.144957, -20.1493309 ], [ -44.1449724, -20.1494106 ], [ -44.1451808, -20.1495048 ], [ -44.1452657, -20.1497511 ], [ -44.1455512, -20.1498598 ], [ -44.145559, -20.1500264 ], [ -44.1451731, -20.1501423 ], [ -44.1450496, -20.150316199999988 ], [ -44.1450496, -20.1504539 ], [ -44.1453197, -20.1503742 ], [ -44.1454123, -20.1502872 ], [ -44.1455127, -20.1503017 ], [ -44.1457133, -20.1506205 ], [ -44.1459062, -20.1506857 ], [ -44.1460297, -20.1511349 ], [ -44.1465853, -20.1518086 ], [ -44.1474805, -20.1522868 ], [ -44.1483294, -20.152381 ], [ -44.1486844, -20.1522506 ], [ -44.1494407, -20.152381 ], [ -44.1496877, -20.1526563 ], [ -44.149896, -20.1528374 ], [ -44.1500041, -20.1530982 ], [ -44.1501584, -20.1531562 ], [ -44.1505751, -20.1529895 ], [ -44.1508684, -20.1530982 ], [ -44.1512157, -20.1529243 ], [ -44.1514337, -20.1528233 ], [ -44.1515938, -20.1529098 ], [ -44.1517713, -20.1527432 ], [ -44.1519565, -20.1527505 ], [ -44.1525199, -20.1531706 ], [ -44.1529289, -20.1538589 ], [ -44.1531758, -20.1543588 ], [ -44.1534029, -20.1544607 ], [ -44.1535962, -20.1547418 ], [ -44.1540942, -20.1549456 ], [ -44.1544877, -20.1551847 ], [ -44.1550048, -20.1553368 ], [ -44.1553598, -20.1552933 ], [ -44.1560006, -20.1553874 ], [ -44.1563225, -20.1553471 ], [ -44.156537, -20.1551658 ], [ -44.1566311, -20.1549662 ], [ -44.1567014, -20.1545265 ], [ -44.1569376, -20.1541547 ], [ -44.1572369, -20.1537896 ], [ -44.1575371, -20.15363 ], [ -44.1576538, -20.1535679 ], [ -44.1579302, -20.1534763 ], [ -44.1581463, -20.1534047 ], [ -44.1584728, -20.1534343 ], [ -44.1585915, -20.1535542 ], [ -44.1585875, -20.1537298 ], [ -44.1586175, -20.1538619 ], [ -44.1586383, -20.1539537 ], [ -44.15865, -20.1540054 ], [ -44.1586679, -20.1540358 ], [ -44.1588072, -20.1542726 ], [ -44.1588999, -20.1543883 ], [ -44.1590298, -20.1545482 ], [ -44.1590689, -20.1547624 ], [ -44.1590801, -20.1549285 ], [ -44.1590422, -20.1552041 ], [ -44.1589533, -20.1555531 ], [ -44.1589397, -20.1557998 ], [ -44.1587654, -20.1561709 ], [ -44.1585696, -20.1565098 ], [ -44.158451, -20.1568742 ], [ -44.1583872, -20.1572451 ], [ -44.1584355, -20.157512 ], [ -44.1587573, -20.1576782 ], [ -44.1589075, -20.1579854 ], [ -44.1590819, -20.158076 ], [ -44.1592971, -20.1578934 ], [ -44.1597849, -20.1576554 ], [ -44.1594418, -20.1575479 ], [ -44.1593234, -20.1573952 ], [ -44.1593071, -20.1572095 ], [ -44.1593804, -20.1570827 ], [ -44.159392, -20.1570031 ], [ -44.1594576, -20.1568654 ], [ -44.1594615, -20.1567096 ], [ -44.1592938, -20.1565804 ], [ -44.1592079, -20.1564897 ], [ -44.1591463, -20.156384 ], [ -44.1591516, -20.1563109 ], [ -44.1592053, -20.1561976 ], [ -44.1592401, -20.1560818 ], [ -44.1592804, -20.1559685 ], [ -44.1592989, -20.1556886 ], [ -44.1593581, -20.1553314 ], [ -44.1593905, -20.155125 ], [ -44.1595191, -20.1548883 ], [ -44.1595942, -20.1547725 ], [ -44.1596654, -20.1546147 ], [ -44.1596966, -20.1544773 ], [ -44.1597275, -20.1542738 ], [ -44.1597423, -20.1541046 ], [ -44.1597178, -20.1539095 ], [ -44.1596246, -20.1537817 ], [ -44.1595286, -20.1536809 ], [ -44.1594373, -20.1536171 ], [ -44.159326, -20.1536696 ], [ -44.1591436, -20.1536117 ], [ -44.1590309, -20.1534656 ], [ -44.1591758, -20.1531333 ], [ -44.1593233, -20.1528991 ], [ -44.1593984, -20.1527077 ], [ -44.1593742, -20.1526171 ], [ -44.1591704, -20.152607 ], [ -44.1590256, -20.1526649 ], [ -44.1587031, -20.1528541 ], [ -44.1586062, -20.1528963 ], [ -44.1584731, -20.1529324 ], [ -44.158383, -20.1529544 ], [ -44.1582183, -20.1529654 ], [ -44.1579488, -20.152963 ], [ -44.1576747, -20.1529664 ], [ -44.1574324, -20.152936 ], [ -44.1571908, -20.15292 ], [ -44.1568406, -20.1528169 ], [ -44.1565827, -20.152796 ], [ -44.156549, -20.1527075 ], [ -44.1564144, -20.1527012 ], [ -44.1561922, -20.1527833 ], [ -44.1561181, -20.1529224 ], [ -44.1558825, -20.1531499 ], [ -44.1556334, -20.1533016 ], [ -44.155189, -20.1534027 ], [ -44.1551284, -20.1534849 ], [ -44.1552227, -20.1536113 ], [ -44.155088, -20.1537756 ], [ -44.1545831, -20.15402850000001 ], [ -44.1541682, -20.154016099999989 ], [ -44.1534228, -20.1534677 ], [ -44.1529262, -20.1530149 ], [ -44.152469, -20.152619 ], [ -44.1523882, -20.1523725 ], [ -44.1522536, -20.152258700000012 ], [ -44.1519574, -20.1522398 ], [ -44.1516611, -20.1521197 ], [ -44.1514902, -20.1521404 ], [ -44.151445699999989, -20.1522524 ], [ -44.1513109, -20.1522273 ], [ -44.1512115, -20.152186 ], [ -44.1510858, -20.1520586 ], [ -44.1510223, -20.1519509 ], [ -44.1510229, -20.1521048 ], [ -44.150923, -20.1521066 ], [ -44.1508465, -20.151955399999988 ], [ -44.1506713, -20.1519616 ], [ -44.150565, -20.1521506 ], [ -44.1503903, -20.1521689 ], [ -44.1501217, -20.1519806 ], [ -44.1495385, -20.1517675 ], [ -44.1491412, -20.1517472 ], [ -44.1487593, -20.1515824 ], [ -44.1484255, -20.1510509 ], [ -44.1484335, -20.1509451 ], [ -44.1482994, -20.1506706 ], [ -44.1480553, -20.1504264 ], [ -44.1478407, -20.1501595 ], [ -44.147722, -20.1499324 ], [ -44.1474384, -20.1497793 ], [ -44.1472916, -20.149661 ], [ -44.1469932, -20.1495199 ], [ -44.1465265, -20.1492933 ], [ -44.14621, -20.1491976 ], [ -44.1460007, -20.1487292 ], [ -44.1455823, -20.1482558 ], [ -44.1454375, -20.1480191 ], [ -44.1453141, -20.1477472 ], [ -44.1452094, -20.1472276 ], [ -44.1451805, -20.1471765 ], [ -44.1449118, -20.1470018 ], [ -44.1447766, -20.1467103 ], [ -44.1447254, -20.1465987 ], [ -44.1447671, -20.14639360000001 ], [ -44.145016, -20.14633 ], [ -44.1452277, -20.1458352 ], [ -44.1453594, -20.1455273 ], [ -44.1455142, -20.1454388 ], [ -44.145830599999989, -20.1455083 ], [ -44.1460529, -20.1454041 ], [ -44.1461146, -20.1451723 ], [ -44.1462548, -20.1443829 ], [ -44.1462983, -20.1441919 ], [ -44.1463602, -20.1439197 ], [ -44.1460812, -20.1435772 ], [ -44.1455072, -20.1434362 ], [ -44.1453505, -20.1434086 ], [ -44.1452122, -20.1432095 ], [ -44.1448259, -20.1429426 ], [ -44.1446704, -20.1424138 ], [ -44.1444236, -20.1417339 ], [ -44.1444785, -20.1415352 ], [ -44.1445249, -20.1409918 ], [ -44.1448104, -20.1404086 ], [ -44.1446252, -20.1400862 ], [ -44.1446483, -20.1399992 ], [ -44.144849, -20.1399485 ], [ -44.1452271, -20.1396514 ], [ -44.1455898, -20.1393399 ], [ -44.1455411, -20.1391748 ], [ -44.1453459, -20.1391748 ], [ -44.1451843, -20.139111599999985 ], [ -44.1450256, -20.1392224 ], [ -44.1442661, -20.1392613 ], [ -44.1441946, -20.1391242 ], [ -44.144437, -20.139099 ], [ -44.1445582, -20.1389536 ], [ -44.1447332, -20.1382393 ], [ -44.1448342, -20.1381508 ], [ -44.1453352, -20.1381734 ], [ -44.1454586, -20.138050199999984 ], [ -44.1453197, -20.1378256 ], [ -44.1454123, -20.1375503 ], [ -44.1451422, -20.1373257 ], [ -44.1451114, -20.1368257 ], [ -44.1446483, -20.1364345 ], [ -44.144547, -20.135942 ], [ -44.1443831, -20.1356603 ], [ -44.1443937, -20.1354491 ], [ -44.1447872, -20.135123 ], [ -44.1447079, -20.1347634 ], [ -44.1442573, -20.134562 ], [ -44.1443485, -20.1341943 ], [ -44.1444826, -20.1337511 ], [ -44.1447401, -20.1334136 ], [ -44.1448742, -20.1332525 ], [ -44.1450727, -20.133146700000012 ], [ -44.1453034, -20.1330208 ], [ -44.145416, -20.1330208 ], [ -44.145577, -20.1328143 ], [ -44.1459525, -20.132371 ], [ -44.1463637, -20.1318546 ], [ -44.1468537, -20.1314292 ], [ -44.1470407, -20.1312947 ], [ -44.1470287, -20.1310642 ], [ -44.1474116, -20.1309255 ], [ -44.1475081, -20.1306737 ], [ -44.1473367, -20.1306315 ], [ -44.1472453, -20.1308046 ], [ -44.1470254, -20.1308349 ], [ -44.1469181, -20.1307341 ], [ -44.146902, -20.1303513 ], [ -44.1466391, -20.1303614 ], [ -44.1464299, -20.1300693 ], [ -44.1464245, -20.1293843 ], [ -44.1462422, -20.1292936 ], [ -44.1460473, -20.129656 ], [ -44.1459883, -20.1299401 ], [ -44.1460819, -20.130213 ], [ -44.1460596, -20.1305022 ], [ -44.1459712, -20.1306683 ], [ -44.1458249, -20.130715 ], [ -44.1456917, -20.1307618 ], [ -44.1455546, -20.1307654 ], [ -44.1454785, -20.130784 ], [ -44.1453142, -20.1309207 ], [ -44.145269, -20.1311319 ], [ -44.1451871, -20.1314277 ], [ -44.145092, -20.1315659 ], [ -44.1448957, -20.1316911 ], [ -44.1445421, -20.1318436 ], [ -44.1442037, -20.132225 ], [ -44.1438604, -20.1323358 ], [ -44.1437423, -20.1324063 ], [ -44.1430509, -20.1325364 ], [ -44.1426187, -20.1325726 ], [ -44.1423208, -20.1324642 ], [ -44.1421169, -20.1323434 ], [ -44.141913, -20.1322703 ], [ -44.1416556, -20.1321922 ], [ -44.1413486, -20.13215 ], [ -44.1411057, -20.132184699999989 ], [ -44.1406856, -20.132013 ], [ -44.1405356, -20.1318157 ], [ -44.1403222, -20.1317327 ], [ -44.1402727, -20.131464 ], [ -44.1400016, -20.1312841 ], [ -44.1399871, -20.1310437 ], [ -44.1398981, -20.1309079 ], [ -44.1398661, -20.1307765 ], [ -44.1398019, -20.1306452 ], [ -44.1396399, -20.1306887 ], [ -44.1395734, -20.1310184 ], [ -44.1394553, -20.131269 ], [ -44.1393174, -20.1314557 ], [ -44.1391846, -20.1318915 ], [ -44.1389608, -20.1319639 ], [ -44.1390919, -20.1321016 ], [ -44.1393775, -20.1320944 ], [ -44.1396257, -20.1322983 ], [ -44.1397549, -20.1324281 ], [ -44.1399604, -20.1325775 ], [ -44.140094499999989, -20.1328092 ], [ -44.1403145, -20.1330409 ], [ -44.140481, -20.1333841 ], [ -44.1405786, -20.1339191 ], [ -44.1398701, -20.1344117 ], [ -44.1393543, -20.1347897 ], [ -44.139145, -20.1351361 ], [ -44.1388446, -20.1353275 ], [ -44.1384289, -20.1350732 ], [ -44.138276, -20.1348919 ], [ -44.1380292, -20.1348667 ], [ -44.1375639, -20.1350651 ], [ -44.1374647, -20.1353001 ], [ -44.1372707, -20.1354781 ], [ -44.1372889, -20.1358664 ], [ -44.1369993, -20.1360276 ], [ -44.1366828, -20.1358513 ], [ -44.1364064, -20.1359708 ], [ -44.1365004, -20.136224 ], [ -44.1363233, -20.1363651 ], [ -44.1354436, -20.1367629 ], [ -44.1351271, -20.1371961 ], [ -44.13495, -20.137382400000011 ], [ -44.1345692, -20.1368083 ], [ -44.1344726, -20.1368486 ], [ -44.1343278, -20.136773 ], [ -44.1340542, -20.1369493 ], [ -44.1333139, -20.1371004 ], [ -44.1328848, -20.1375637 ], [ -44.1328179, -20.1381806 ], [ -44.1324937, -20.1385646 ], [ -44.1323008, -20.1385791 ], [ -44.1318532, -20.1380212 ], [ -44.1317297, -20.1379705 ], [ -44.131614, -20.1381661 ], [ -44.1320211, -20.1389488 ], [ -44.1319996, -20.1393013 ], [ -44.1317475, -20.139779799999989 ], [ -44.1308731, -20.1405806 ], [ -44.1297519, -20.1407871 ], [ -44.1293335, -20.1412403 ], [ -44.1287005, -20.1413511 ], [ -44.1278529, -20.1410792 ], [ -44.1274448, -20.141102499999988 ], [ -44.126029, -20.1403539 ], [ -44.1253322, -20.1401948 ], [ -44.1249386, -20.1398833 ], [ -44.1246299, -20.1397746 ], [ -44.1243339, -20.1393768 ], [ -44.1241407, -20.1391351 ], [ -44.1239444, -20.138928 ], [ -44.1236794, -20.1388531 ], [ -44.1235989, -20.1387926 ], [ -44.1235185, -20.1387272 ], [ -44.1234005, -20.1386415 ], [ -44.1232932, -20.1385559 ], [ -44.1232395, -20.1384804 ], [ -44.1232073, -20.1384099 ], [ -44.1231376, -20.1383293 ], [ -44.1230974, -20.1382915 ], [ -44.1229954, -20.1382109 ], [ -44.1229096, -20.1381404 ], [ -44.1228506, -20.1380699 ], [ -44.1227835, -20.1379818 ], [ -44.122665499999989, -20.1378609 ], [ -44.1224885, -20.1377148 ], [ -44.122349, -20.137594 ], [ -44.1220701, -20.1372767 ], [ -44.1219038, -20.1370903 ], [ -44.1216838, -20.1368284 ], [ -44.1212807, -20.1361157 ], [ -44.1212547, -20.1355189 ], [ -44.1210291, -20.135124 ], [ -44.1210884, -20.1348843 ], [ -44.1213244, -20.1347836 ], [ -44.1216665, -20.1343622 ], [ -44.1217697, -20.1334841 ], [ -44.1221237, -20.133323 ], [ -44.1222067, -20.1328841 ], [ -44.1222793, -20.1324416 ], [ -44.1223442, -20.132118699999989 ], [ -44.122494, -20.1318724 ], [ -44.1226107, -20.131343 ], [ -44.1229177, -20.1308248 ], [ -44.1230115, -20.1307391 ], [ -44.1231644, -20.1306032 ], [ -44.1237704, -20.1299803 ], [ -44.1252198, -20.1294436 ], [ -44.1259808, -20.1290695 ], [ -44.126409, -20.1283304 ], [ -44.1270995, -20.125348 ], [ -44.1270581, -20.1240512 ], [ -44.1262275, -20.121975 ], [ -44.1252673, -20.1216225 ], [ -44.1251439, -20.120469 ], [ -44.1241032, -20.1204136 ], [ -44.1235238, -20.1194162 ], [ -44.1227996, -20.118565 ], [ -44.1215476, -20.1179694 ], [ -44.121435338508107, -20.117511492969005 ] ] ]));

// Now hit Run to start the demo! 
// Do not forget to delete/out comment this geometry before creating a new one!

//**************************************DISCLAIMER!****************************************************
//The borders of the displayed geometry (under variable 'AOI') are not stringently proven by the UN
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

//=====================================================================================================
//                             SELECT YOUR OWN STUDY AREA   

// Use the polygon-tool in the top left corner of the map pane to draw the shape of your 
// study area. Single clicks add vertices, double-clicking completes the polygon.
//*************************************CAUTION!**********************************************
//Afterwards, go to the setting of the polygon (gear-symbol within your 'Geometry Imports'),
//rename the polygon to 'ROI' and change the 'Import as' drop down to 'FeatureCollection'.
// **CAREFUL**: Under 'Geometry Imports' (top left in map pane) uncheck the 
//              geometry box, so it does not block the view on the imagery later.

//**********************************Alternatively:*******************************************
//Upload your shapefile via the 'Assets' tab in the upper left corner. Select 'NEW' => 'Shape Files'
//and upload the four relevant files of your shapefile (.dbf, .prj, .shp, .shx). Once uploaded, refresh
//the assets and import your shapefile from the asset tab into this script by clicking the arrow symbol.
//Rename the imported asset to 'AOI' (Area of Interest).

//=====================================================================================================
//                                     SET TIME FRAME
//If you want to use another period of time than the whole time span of MODIS data, change the 
//code between ee.Date brackets (start_date & end_date) to the desired dates.
//Keep in mind, that a reduction of the time span will lead to a less accurate SVI calculation.

var start_date = ee.Date(ee.List(MOD13Q1_imageCollection.get('date_range')).get(0)).advance(-1,'day');
var end_date = ee.Date(ee.List(MOD13Q1_imageCollection.get('date_range')).get(1)).advance(+1,'day');
print('The considered time period begins on ', start_date.advance(+1,'day').format('YYYY-MM-dd'),'and ends on ', end_date.advance(-1,'day').format('YYYY-MM-dd'));

//                                 SET TIME FRAME FOR SVI CALCULATION
//As the calculation of the SVI over all images of the whole investigation period might cause issues, 
//a reduction of the timeframe is advisable. You can change the start and end point for the export selection 
//below.

var startFilteredSVI = '2019-06-01';
var endFilteredSVI = end_date;

//=====================================================================================================
//                                     SET RESOLUTION
//MODIS Vegetation Indices have a resolution of 250 meter. Depending on the size of your AOI it might
//be useful to decrease the resolution to a certain extent (eg. 1000). This shortens the processing time.
//However, the defined resolution effects the statistic calculations (plotted charts) and the exported
//image, not the displayed image.

var resolution = 500; //the resolution might be increased up to 250 depending on the AOI size

//=====================================================================================================
//                                    INTERACTIVE CHART
//Show interactive chart when clicking on a pixel?
var showInteractiveChart = true; //set to "true" if you want to use the interactive chart. Otherwise set to "false"


//=====================================================================================================
//=====================================================================================================



//                                  START OF THE SCRIPT
//Extract bit-wise information from quality bitmask
function bitwiseExtract(value, fromBit, toBit) {
  if (toBit === undefined)
    toBit = fromBit
  var maskSize = ee.Number(1).add(toBit).subtract(fromBit)
  var mask = ee.Number(1).leftShift(maskSize).subtract(1)
  return value.rightShift(fromBit).bitwiseAnd(mask)
}

function maskClouds(image) {
  var qa = image.select('DetailedQA')

  var quality = bitwiseExtract(qa, 0, 1)
  var usefulness = bitwiseExtract(qa, 2, 5)
  var aerosolQuantity = bitwiseExtract(qa, 6, 7)
  var adjacentCloudDetected = bitwiseExtract(qa, 8)
  var atmosphereBrdfCorrection = bitwiseExtract(qa, 9)
  var mixedClouds = bitwiseExtract(qa, 10)
  var landWaterMask = bitwiseExtract(qa, 11, 13)
  var possibleSnowIce = bitwiseExtract(qa, 14)
  var possibleShadow = bitwiseExtract(qa, 15)
  var mask = quality.lte(1) // VI produced, but check other QA
    .and(usefulness.lte(4)) 
    .and(aerosolQuantity.lte(2)) 
    .and(adjacentCloudDetected.eq(0)) // No
    .and(mixedClouds.eq(0)) // No
    .and(possibleSnowIce.eq(0)) // No
    .and(possibleShadow.eq(0)) // No
  return image.select(['EVI'], ['EVI_Masked']).updateMask(mask)
}

//Add MODIS Data
var evi = MOD13Q1_imageCollection.select(['EVI', 'DetailedQA'])
  .filterDate(start_date, end_date)
  .filterBounds(AOI)
  .map(function(image){return image.clip(AOI)})
  .map(maskClouds);

//print('EVI image collection', evi)

//*************************************************************************************************
//Calculate statistics and SVI


//Select band that will be used for SVI calculation
var SelectImageForStats = evi.select(['EVI_Masked']);



//Calculate statistics for each image
var statsCollection = SelectImageForStats.map(function(stats){
  var startDOY = ee.Date(stats.get('system:time_start')).getRelative('day', 'year');
  var endDOY = ee.Date(stats.get('system:time_end')).getRelative('day', 'year');
  var collectionForStats = SelectImageForStats
    .filter(ee.Filter.calendarRange(startDOY, endDOY, 'day_of_year'))
    .reduce(ee.Reducer.stdDev().combine(ee.Reducer.mean(), null, true));
  return stats
    .addBands(collectionForStats)
});



//Calculate z-scores
var ZCollection = statsCollection.map(function(toZscore){
  var SelectImageForSVI = toZscore.select(['EVI_Masked'], ['Z_Score']);
  var calc = toZscore.expression('(evi - mean) / stdDev', 
  {
    evi: SelectImageForSVI, 
    mean: toZscore.select('EVI_Masked_mean'), 
    stdDev: toZscore.select('EVI_Masked_stdDev')});
  return toZscore
    .addBands(calc)
    .set({
      startDate: ee.Date(toZscore.get('system:time_start')).format('YYYY_MM_dd_DD'),
      endDate: ee.Date(toZscore.get('system:time_end')).format('YYYY_MM_dd_DD'),
      Start_Date: ee.Date(toZscore.get('system:time_start')).format('YYYY-MM-dd')
    });
});





//Calculate SVI
var SVI = ZCollection.filterDate(startFilteredSVI, endFilteredSVI).map(function(image){ 
  var zscore = image.select('Z_Score')
  var startDOY = ee.Date(image.get('system:time_start')).getRelative('day', 'year');
  var endDOY = ee.Date(image.get('system:time_end')).getRelative('day', 'year');
  
  //Map over all z-score images and look whether each pixel in each image is lower than the current z-score image's pixel values.
  var lower_images = ZCollection
    .filter(ee.Filter.calendarRange(startDOY, endDOY, 'day_of_year'))
    .select(['Z_Score'], ['SVI_lower'])
    .map(function(tester){
      var lower = tester.lt(zscore)
    //Returning a full image collection for each z-score image.
    //Each image  in this image collection contains a masked image with pixel values of 1 if the pixel value in the image is lower than the one in the z-score image of the current iteration
      return lower
    })
  
  //Create a single image out of the image collection with the total number of times the pixel value was lower than in the reference image (current z-score image)
  var lower_than = lower_images.reduce(ee.Reducer.sum())
  //Calculate the total number of all observations per pixel
  var total =  ZCollection.filter(ee.Filter.calendarRange(startDOY, endDOY, 'day_of_year')).select(['Z_Score'], ['SVI_total']).reduce(ee.Reducer.count())
  //Calculate the SVI by dividing the number of times the z-score was lower than in the current image by the total number of observed values
  var proba = lower_than.divide(total).rename('SVI')
  return image
    .addBands(proba)
})

//print(SVI)


//*************************************************************************************************************
//Create selection drop down
//Makes it possible to select any image from the SPI imagecollection to visualize it
//Is also used to select the default image that is visualized after the script is run

//Create a List of all Start_Dates (which are stored in the metadata of each image)
var imgDateList = SVI.aggregate_array('Start_Date')

var selectMenu = ui.Select({
  items: imgDateList.getInfo(), //Turn the list of dates into a client side array which is displayed in the dropdown menu
  //value: imgDateList.get(0).getInfo(),
  onChange: renderDateImage, //Trigger the function on every change in the dropdown menu
})
Map.add(selectMenu)

//Function to display the corresponding image to the user-selected date (from the dropdown menu)
function renderDateImage(value) {
  var image = ee.Image(SVI
    .filter(
      ee.Filter.eq('Start_Date',value)
    ).first())

  var start_str = image.get('startDate')
  var end_str = image.get('endDate')
  
  var layer = ui.Map.Layer(image, SviVis, 'SVI '+start_str.getInfo()+' to '+end_str.getInfo(), true)
  Map.layers().reset([layer])
}



//************************************************************************************************* 
//Display Data
Map.centerObject(AOI, 8); //Center map view to AOI


  //filters the latest image from image collection by the given end date. The given Name uses the end date as well
var imageToVisualize = SVI.limit(1, 'system:time_start', false).first();
var imageStartDate = imageToVisualize.get('startDate');
var imageEndDate = imageToVisualize.get('endDate');

Map.addLayer(imageToVisualize, SviVis, 'SVI '+imageStartDate.getInfo()+' to '+imageEndDate.getInfo());
//************************************************************************************************* 


//Create a chart of Z_Scores and EVI over time
//Add labels to AOI feature collection. Labels will be used for the charts
var RoiWithLabels = AOI.map(function(addLabels){
  var labelNames = addLabels.set('labelEVI','EVI').set('labelSVI', 'SVI').set('label_Z_Score', 'Z-Score');
  return labelNames;
});

//Plot SVI Chart
var SVI_Chart = ui.Chart.image.seriesByRegion(
  SVI, //Image collection to be used
  RoiWithLabels, //Region that will be observed in Chart
  ee.Reducer.mean(), //Reducer type
  'SVI', //Band to be used
  resolution, //Scale in meter
  'system:time_start', 
  'labelSVI' //label
  ).setOptions({
    title: 'SVI Time Series',
    vAxis: {title: 'SVI'},
    hAxis: {title: 'Year'},
    //legend: {position: 'none'},
});
print('SVI chart based on mean values within AOI:',SVI_Chart);


//*************************************************************************************************
//Inspector Chart
// Create a panel to hold the chart.
if (showInteractiveChart === true){
  var inspectorPanel = ui.Panel({
    style:{
      width: '400px',
      position: 'bottom-right'
    }
  });
  Map.add(inspectorPanel);
  
  // Register a function to draw a chart when a user clicks on the map.
 // Map.onClick(function(coords) {
 // inspectorPanel.clear();
 // var point = ee.FeatureCollection(ee.Geometry.Point(coords.lon, coords.lat)).map(function(addLabels){
 // var labelNames = addLabels.set('label_SVI', 'SVI');
 // return labelNames;
//});
  
    //Button to hide Panel once the chart is loaded
  var hideButton = ui.Button({
    label: 'X',
    onClick: function(){
      inspectorPanel.clear();
    },
    style:{
      color: 'red',
    }
  });
  inspectorPanel.add(hideButton);
  
    //Chart to display data history of clicked point
  var inspectorChart = ui.Chart.image.seriesByRegion(SVI, 
//  point, 
  ee.Reducer.mean(),
  'SVI', 
  resolution, //Scale in meter
  'system:time_start', 
  'label_SVI' //label
  ).setOptions({
    title: 'SVI Time Series (based on EVI)',
    vAxis: {title: 'SVI'},
    hAxis: {title: 'Year'},
    //legend: {position: 'none'},
    });
  inspectorChart.setOptions({title: 'SVI value for requested pixel'});
  inspectorPanel.add(inspectorChart);
  

  
 // });
//}

//************************************************************************************************* 
//Create title
//Add Title
var title = ui.Label({
  value: 'Standard Vegetation Index (SVI)',
  style:{
  fontWeight: 'bold',
  fontSize: '18px'
  }});
title.style().set('position', 'top-center');
Map.add(title);

//************************************************************************************************* 
//Create legend

//Get Max and Min values from imports-section with one decimal 
var getSviVisMax = 1
var getSviVisMin = 0

//Create Colorramp information
var vizSVI = {min: getSviVisMin, max:getSviVisMax, palette:SviVis.palette};

//Add main panel which will contain smaller panels for each legend (SVI, EVI, Mean EVI)
    var mainPanel = ui.Panel({
      layout: ui.Panel.Layout.flow('horizontal'),
      style: {
        position: 'bottom-left',
        padding: '8px 15px'
      }
    });
//**************************************************
//Add SVI Legend
          //Add new panel for SVI legend within the main Panel
        var sviLegend = ui.Panel({
          style: {
             //position: 'bottom-left',
             padding: '0 0'
           }
        });
        mainPanel.add(sviLegend);
          
         //Create a checkbox which will enable a toggle function to show the SVI legend
        var sviCheckbox = ui.Checkbox('Show SVI Legend', false);
          //Provide information what happens if the checkbox is checked or unchecked
     //   sviCheckbox.onChange(function(checked) {
        //  if (checked) { //if it is checked, fill the SVI legend panel with information
         //     //Create legend title
            //  var sviLegendTitle = ui.Label({
            //    value: 'SVI',
            //    style: {
              //    fontWeight: 'bold',
             //     fontSize: '18px',
             //     margin: '0 auto',
             //     padding: '0 auto'
                //  }
              //});
              
               // Add the title to the panel
              sviLegend.add(sviLegendTitle);
              
              // create the legend image
              var sviLon = ee.Image.pixelLonLat().select('latitude');
              var sviGradient = sviLon.multiply((vizSVI.max-vizSVI.min)/100.0).add(vizSVI.min);
              var sviLegendImage = sviGradient.visualize(vizSVI);
              
              // create text on top of legend
              var sviPanelMax = ui.Panel({
                  widgets: [
                    ui.Label(vizSVI['max'])
                  ],
                  style: {
                    padding: '0 auto',
                    margin: '0 auto',
                    position: 'bottom-center'
                  }
                });
              
              sviLegend.add(sviPanelMax);
                
              // create thumbnail from the image
              var sviThumbnail = ui.Thumbnail({
                image: sviLegendImage, 
                params: {bbox:'0,0,10,100', dimensions:'10x150'},  
                style: {
                    padding: '0 auto',
                    margin: '0 auto',
                    position: 'bottom-center'
                  }
              });
              
              // add the thumbnail to the legend
              sviLegend.add(sviThumbnail);
              
              // create text on top of legend
              var sviPanelMin = ui.Panel({
                  widgets: [
                    ui.Label(vizSVI['min'])
                  ],
                  style: {
                    padding: '0 auto',
                    margin: '0 auto',
                    position: 'bottom-center'
                  }
                  });
              
              sviLegend.add(sviPanelMin);
        
        
          } else {
            sviLegend.clear();
          }
        //});
        print(sviCheckbox);
Map.add(mainPanel)
//************************************************************************************************* 


//Add exports to tasks tab
var batch = require('users/fitoprincipe/geetools:batch');
var ImageCollectionForExport = SVI.select(['SVI']).filterDate(startFilteredSVI, endFilteredSVI);
print('Selected Images for Export',ImageCollectionForExport);

//Map.addLayer(ImageCollectionForExport.first())


batch.Download.ImageCollection.toDrive(ImageCollectionForExport, "SVI",{
  name: 'SVI_{startDate}-{endDate}',
  scale: resolution,
  region: AOI,
  crs: 'EPSG:4326'
});


//Activate all tasks at the same time in the websites console (F12)
//https://github.com/gee-hydro/gee_monkey
print('To activate all tasks, see https://github.com/gee-hydro/gee_monkey')
//=====================================================================================================
//                                          DISCLAIMER
//When providing a large AOI or calculating the images with the highest or lowest SVI, the browser might
//signalise, that Google Earth Engine is not giving any replies. Press 'wait' in order to keep on 
//running the script. It might take a couple of minutes to complete all calculations.

//When adjusting the visualisation parameters in the 'Layers' menu, the information within the legends
//will not change automatically. Import the new visualisation settings, delete the predefined parameters
//from the 'Imports' section and rename your new parameters to the same name, that was used by 
//the default parameter.
