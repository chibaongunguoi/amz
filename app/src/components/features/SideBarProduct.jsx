import React, { useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setBrands, setPriceRanges, resetFilter } from '../../store/slices/filtersSlice';
import { Grid } from 'antd';
function SideBarProduct({
  brands = [],
  priceRanges = [],
  forceShow = false,
  onFilterChange, 
}) {
  const screens = Grid.useBreakpoint()
  const dispatch = useDispatch();
  const { brands: selectedBrands, priceRanges: selectedPrices } = useSelector(
    (state) => state.filters
  );


 

  const memoBrands = useMemo(() => brands, [brands]);

  const handleBrandClick = (brand) => {
    if (selectedBrands.includes(brand)) {
      dispatch(setBrands(selectedBrands.filter((b) => b !== brand)));
    } else {
      dispatch(setBrands([...selectedBrands, brand]));
    }
  };

  const handleReset = () => {
    dispatch(resetFilter());
  };

  const handlePriceChange = (value) => {
    if (selectedPrices.some((v) => v[0] === value[0] && v[1] === value[1])) {
      dispatch(setPriceRanges(selectedPrices.filter((v) => !(v[0] === value[0] && v[1] === value[1]))));
    } else {
      dispatch(setPriceRanges([...selectedPrices, value]));
    }
  };



  useEffect(() => {
    return () => {
      dispatch(resetFilter());
    };
  }, [dispatch]);

  const getCombinedPriceRange = (ranges) => {
    if (!ranges.length) return [];
    const all = ranges.flat();
    const min = Math.min(...all);
    const max = Math.max(...all);
    return [min, max];
  };

  useEffect(() => {
    getCombinedPriceRange(selectedPrices);
  }, [selectedPrices]);

  useEffect(() => {
    if (typeof onFilterChange === 'function') {
      onFilterChange({
        brands: selectedBrands,
        priceRanges: selectedPrices,
      });
    }
  }, [selectedBrands, selectedPrices, onFilterChange]);

  if (!screens.sm && !forceShow) return null;

  return (
    <div>
      <div>
        <div className="font-semibold mb-2 text-orange-600 tracking-wide">Thương hiệu</div>
        <div className="grid grid-cols-2 gap-2">
          {memoBrands.map((brand) => (
            <div
              key={brand}
              onClick={() => handleBrandClick(brand)}
              className={`w-full h-8 rounded-md flex items-center justify-center cursor-pointer font-medium transition-all duration-200
                ${selectedBrands.includes(brand)
                  ? 'border-2 border-orange-500 font-semibold bg-orange-50 scale-105 shadow-md'
                  : 'border border-gray-200 font-normal bg-white hover:bg-orange-100 hover:scale-105'}
              `}
            >
              <span
                className={`
                  transition-colors duration-200
                  font-bold
                  text-black
                  ${screens.md ? 'text-[10px]' : ''}
                  ${screens.lg ? '!text-[14px]' : ''}
                `}
              >
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="font-semibold mb-2 text-orange-600 tracking-wide">Khoảng giá</div>
        {priceRanges.map((range) => (
          <div key={range.label} className="mb-1">
            <label className="cursor-pointer flex items-center group transition-all duration-200">
              <input
                type="checkbox"
                checked={selectedPrices.some(
                  (v) => v[0] === range.value[0] && v[1] === range.value[1]
                )}
                onChange={() => handlePriceChange(range.value)}
                className="accent-orange-500 !mr-1.5 scale-110 transition-transform duration-200 group-hover:scale-125"
              />
              <span className={`transition-colors duration-200 ${
                selectedPrices.some(
                  (v) => v[0] === range.value[0] && v[1] === range.value[1]
                )
                  ? 'text-orange-500 font-semibold'
                  : 'group-hover:text-orange-400'
              }`}>
                {range.label}
              </span>
            </label>
          </div>
        ))}
   
      </div>
       <button
          className="mt-4 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded transition"
          onClick={handleReset}
        >
          Đặt lại bộ lọc
        </button>
    </div>
  );
}

export default SideBarProduct;
