import React, { useEffect, useState } from 'react'
import { useFirestore } from '../../hooks/useFirestore'
// Firebase đã được loại bỏ
import facebook from '../../assets/facebook.svg'
import instagram from '../../assets/instaram.svg'
import tiktok from '../../assets/tiktok.svg'
import whatsapp from '../../assets/whatup.svg'
import youtube from '../../assets/youtube.svg'
import { PHONE_NUMBER } from '../../constants/phoneNumber'
import { useDispatch } from 'react-redux'
import routePath from '../../constants/routePath'
import { setCategory } from '../../store/slices/filtersSlice'
import { Link } from 'react-router-dom'
import { normalizeFooterContactBlock } from '../../constants/footerContact'
import OptimizedImage from '@/components/common/OptimizedImage'

function Footer() {
    const { getAllDocs: getEventsDocs } = useFirestore(null, 'events')
    const { getAllDocs: getUIConfigDocs } = useFirestore(null, 'ui-config')
    const [links, setLinks] = useState({})
    const [uiConfig, setUiConfig] = useState(null)
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchData = async () => {
            // Fetch events (for backward compatibility)
            const eventsDocs = await getEventsDocs()
            if (eventsDocs.length > 0) {
                setLinks(eventsDocs[0])
            }
            
            // Fetch UI config
            const configDocs = await getUIConfigDocs()
            if (configDocs.length > 0) {
                setUiConfig(configDocs[0])
            }
        }
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const contact = normalizeFooterContactBlock(uiConfig?.footer?.contactBlock || {})

    return (
        <div className="bg-white py-8 mt-4 rounded-4 rounded-t-xl">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <h6 className="font-normal text-lg mb-2">Thông tin và chính sách</h6>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    to={routePath.policyPurchase}
                                    onClick={() => dispatch(setCategory("Chính sách mua hàng"))}
                                    style={{
                                        color: "#4B5563",
                                        textDecoration: "none",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#000")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}
                                >
                                    Chính sách mua hàng
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={routePath.policyWarranty}
                                    onClick={() => dispatch(setCategory("Chính sách bảo hành"))}
                                    style={{
                                        color: "#4B5563",
                                        textDecoration: "none",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#000")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}
                                >
                                    Chính sách bảo hành
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={routePath.policyPrivacy}
                                    onClick={() => dispatch(setCategory("Chính sách bảo mật"))}
                                    style={{
                                        color: "#4B5563",
                                        textDecoration: "none",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#000")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}
                                >
                                    Chính sách bảo mật
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h6 className="font-normal text-lg mb-2">Loa</h6>
                        <ul className="space-y-2 text-sm text-gray-600">
                            {(uiConfig?.footer?.categories?.loa || [
                                'Loa mini',
                                'Loa bluetooth cầm tay',
                                'Loa cắm điện',
                                'Loa để bàn',
                                'Loa decor',
                                'Loa cao cấp',
                                'Loa đi cắm trại',
                                'Loa hát karaoke'
                            ]).map((category, idx) => (
                                <li key={idx}>{category}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h6 className="font-normal text-lg mb-2">Tai nghe</h6>
                        <ul className="space-y-2 text-sm text-gray-600">
                            {(uiConfig?.footer?.categories?.taiNghe || [
                                'Tai nghe true wireless',
                                'Tai nghe nhét tai',
                                'Tai nghe chụp tai',
                                'Tai nghe tập gym',
                                'Tai nghe chống ồn'
                            ]).map((category, idx) => (
                                <li key={idx}>{category}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt5">
                    <div className='mt-8'>
                        <h6 className="font-normal text-lg mb-2">{contact.connectTitle}</h6>
                        {contact.locations.map((loc, idx) => (
                            <div key={idx} className={`text-sm ${idx > 0 ? 'mt-4' : ''}`}>
                                {loc.label ? (
                                    <div className="font-medium mb-1">{loc.label}</div>
                                ) : null}
                                {loc.phones.map((p, pIdx) => (
                                    <div key={pIdx} className="font-bold leading-relaxed">
                                        {p}
                                    </div>
                                ))}
                                {loc.address ? (
                                    <div className="mt-1 text-gray-800">
                                        Địa chỉ: {loc.address}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                        <div className='mt-4'>
                            <h6 className="font-normal text-lg">{contact.socialTitle}</h6>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                {(() => {
                                    const socialLinks = uiConfig?.footer?.socialLinks || links
                                    const items = [
                                        { key: 'facebook', url: null, enabled: true, icon: facebook, alt: 'Facebook', color: '#1877F3', onClick: null },
                                        { key: 'instagram', url: null, enabled: true, icon: instagram, alt: 'Instagram', color: '#E4405F', onClick: null },
                                        { key: 'tiktok', url: null, enabled: true, icon: tiktok, alt: 'TikTok', color: '#000000', onClick: null },
                                        { key: 'whatsapp', url: null, enabled: true, icon: whatsapp, alt: 'Whatsapp', color: '#25D366', onClick: () => window.open('tel:' + PHONE_NUMBER.GENERAL) },
                                        { key: 'youtube', url: null, enabled: true, icon: youtube, alt: 'Youtube', color: '#FF0000', onClick: null },
                                    ].map(({ key, icon, alt, color, onClick }) => {
                                        const raw = socialLinks[key] ?? links[key]
                                        const url = typeof raw === 'string' ? raw : (raw?.url ?? '')
                                        const enabled = typeof raw === 'string' ? true : (raw?.enabled !== false)
                                        return { key, url, enabled, icon, alt, color, onClick }
                                    })
                                    return items.filter(({ enabled }) => enabled).map(({ key, url, icon, alt, color, onClick }) => (
                                        <a
                                            key={key}
                                            href={url || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => {
                                                if (!url) e.preventDefault()
                                                if (onClick) { e.preventDefault(); onClick() }
                                            }}
                                            style={{ color, fontSize: '2rem' }}
                                        >
                                            <OptimizedImage src={icon} alt={alt} width={36} height={36} sizes="36px" style={{ width: '36px', height: '36px' }} />
                                        </a>
                                    ))
                                })()}
                            </div>
                        </div>
                    </div>
                    <div >
                        {contact.locations.some((l) => l.mapEmbedUrl) ? (
                            <>
                                <h6 className="font-normal text-lg mt-8">Google maps</h6>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-[10px]">
                                    {contact.locations
                                        .filter((l) => l.mapEmbedUrl)
                                        .map((loc, idx) => (
                                            <iframe
                                                key={idx}
                                                title={loc.label || `Bản đồ ${idx + 1}`}
                                                src={loc.mapEmbedUrl}
                                                className="w-full min-h-[200px]"
                                                style={{ border: 0 }}
                                                allowFullScreen=""
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                            />
                                        ))}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>


            </div>
        </div>
    )
}

export default Footer

