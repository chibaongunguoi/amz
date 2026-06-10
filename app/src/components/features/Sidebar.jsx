import images from '../../utils/images';
import { useDispatch } from "react-redux";
import { setCategory } from "../../store/slices/filtersSlice";
import { useNavigate } from "react-router-dom";
import routePath from "../../constants/routePath";
import { mapSidebarUiValueToCategory } from '../../constants';
import { useFirestore } from '../../hooks/useFirestore';
import { useEffect, useState, useMemo } from 'react';
import { slugify } from '../../utils/format.utils';
import { useProductDisplayCategories } from '@/hooks/useProductDisplayCategories';
import { buildMainNavItemConfigs, buildExploreNavItemConfigs } from '@/utils/productNavBuilders';
import OptimizedImage from '@/components/common/OptimizedImage';

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { getAllDocs } = useFirestore(null, 'ui-config');
  const [uiConfig, setUiConfig] = useState(null);
  const { rows } = useProductDisplayCategories();

  const defaultMainItems = useMemo(
    () =>
      buildMainNavItemConfigs(rows).map((c) => ({
        icon: <OptimizedImage src={images[c.imageKey] || images['item11.png']} alt="" width={30} height={30} sizes="30px" />,
        label: c.label,
        value: c.filterValue,
        navKind: c.kind,
      })),
    [rows]
  );

  const defaultExploreItems = useMemo(
    () =>
      buildExploreNavItemConfigs(rows).map((c) => ({
        icon: <OptimizedImage src={images[c.imageKey] || images['item5.png']} alt="" width={30} height={30} sizes="30px" />,
        label: c.label,
        value: c.filterValue,
        navKind: c.kind,
      })),
    [rows]
  );

  useEffect(() => {
    const fetchUIConfig = async () => {
      try {
        const docs = await getAllDocs();
        if (docs.length > 0) {
          setUiConfig(docs[0]);
        }
      } catch (error) {
        console.error('Error loading UI config:', error);
      }
    };
    fetchUIConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get items from config or use defaults
  const getMainItems = () => {
    if (uiConfig?.sidebar?.mainItems) {
      return uiConfig.sidebar.mainItems
        .filter(item => item.enabled)
        .sort((a, b) => a.order - b.order)
        .map(item => ({
          icon: <OptimizedImage src={images[item.icon] || images['item11.png']} alt="" width={30} height={30} sizes="30px" />,
          label: item.label,
          value: item.value,
        }));
    }
    return defaultMainItems;
  };

  const isHiddenExploreItem = (item) =>
    item?.navKind === 'newseal' ||
    item?.label === 'Hàng newseal' ||
    item?.value === 'Hàng newseal';

  const getExploreItems = () => {
    if (uiConfig?.sidebar?.exploreItems) {
      return uiConfig.sidebar.exploreItems
        .filter((item) => item.enabled && !isHiddenExploreItem(item))
        .sort((a, b) => a.order - b.order)
        .map(item => ({
          icon: <OptimizedImage src={images[item.icon] || images['item5.png']} alt="" width={30} height={30} sizes="30px" />,
          label: item.label,
          value: item.value,
        }));
    }
    return defaultExploreItems;
  };

  const displayMainItems = getMainItems();
  const displayExploreItems = getExploreItems();

  return (
    <>
      <div className="bg-white rounded-lg shadow p-3 mb-4">
        <div className="font-semibold text-[13px] text-gray-700 mb-2 tracking-wide hidden md:block lg:hidden">
          Hàng cũ giá tốt
        </div>
        <div className="font-semibold text-[16px] text-gray-700 mb-2 tracking-wide hidden lg:block">
          Hàng cũ giá tốt - Sản phẩm chính
        </div>
        <div className="flex flex-col pb-4">
          <div className="flex flex-col gap-3">
            {displayMainItems.map((item, idx) => (
              <div
                key={idx}
                className="w-full flex items-center gap-3 text-[15px] text-gray-800 rounded py-1 cursor-pointer transition-all duration-200 group hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:scale-[1.03] hover:shadow-md"
                onClick={() => {
                  if (item.value === "Thu cũ đổi mới" || item.navKind === 'exchange') {
                    dispatch(setCategory("Thu cũ đổi mới"))
                    navigate(routePath.policyExchange);
                  } else {
                    dispatch(setCategory(mapSidebarUiValueToCategory(item.value)));
                    const categorySlug = slugify(item.label);
                    navigate(`/product/${categorySlug}`);
                  }
                }}
              >
                <span className="transition-transform duration-200 group-hover:scale-110 lg:pl-6 md:pl-0">
                  {item.icon}
                </span>
                <span className="transition-colors duration-200 group-hover:text-blue-700 font-semibold lg:text-[16px] md:text-[11px]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-3">
        <div className="font-semibold text-[13px] text-gray-700 mb-2 tracking-wide hidden md:block lg:hidden">
          Khám phá thêm
        </div>
        <div className="font-semibold text-[16px] text-gray-700 mb-2 tracking-wide hidden lg:block">
          Khám phá thêm
        </div>
        <div className="flex flex-col pb-4">
          <div className="flex flex-col gap-3">
            {displayExploreItems.map((item, idx) => (
              <div
                key={idx}
                className="w-full flex items-center gap-3 text-[15px] text-gray-800 rounded py-1 cursor-pointer transition-all duration-200 group hover:bg-gradient-to-r hover:from-pink-100 hover:to-yellow-100 hover:scale-[1.03] hover:shadow-md"
                onClick={() => {
                  if (item.navKind === 'sale' || item.label === "Khuyến mãi hot") {
                    navigate(routePath.sale);
                  } else if (item.navKind === 'warranty' || item.label === "Bảo hành - sửa chữa") {
                    dispatch(setCategory("Bảo hành - sửa chữa"));
                    navigate(routePath.policyWarranty);
                  } else if (item.navKind === 'posts' || item.label === "Bài viết") {
                    navigate(routePath.posts);
                  }
                }}
              >
                <span className="transition-transform duration-200 group-hover:scale-110 lg:pl-6 md:pl-0">
                  {item.icon}
                </span>
                <span className="transition-colors duration-200 group-hover:text-pink-700 font-semibold lg:text-[16px] md:text-[11px]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
