// Test slide extraction logic
const block = {
  settings: {
    banner_image: "shopify://shop_images/Cetaphil-Winter-Care-Routine.png",
    banner_link: "",
    second_banner_image: null,
    second_banner_link: "",
    third_banner_image: "shopify://shop_images/Elite_Pro_Beauty_Membership_Banner.png",
    third_banner_link: "/pages/elite-pro",
    enable_third_banner: true,
    fourth_banner_image: null,
    fourth_banner_link: "",
    enable_fourth_banner: true,
    fifth_banner_image: null,
    fifth_banner_link: "",
    enable_fifth_banner: true,
    sixth_banner_image: null,
    sixth_banner_link: "",
    enable_sixth_banner: true
  }
};

const rawSlides = [
  { img: block.settings.banner_image, link: block.settings.banner_link, enabled: true, num: 1 },
  { img: block.settings.second_banner_image, link: block.settings.second_banner_link, enabled: true, num: 2 },
  { img: block.settings.third_banner_image, link: block.settings.third_banner_link, enabled: block.settings.enable_third_banner !== false, num: 3 },
  { img: block.settings.fourth_banner_image, link: block.settings.fourth_banner_link, enabled: block.settings.enable_fourth_banner !== false, num: 4 },
  { img: block.settings.fifth_banner_image, link: block.settings.fifth_banner_link, enabled: block.settings.enable_fifth_banner !== false, num: 5 },
  { img: block.settings.sixth_banner_image, link: block.settings.sixth_banner_link, enabled: block.settings.enable_sixth_banner !== false, num: 6 }
];

const validSlides = rawSlides.filter(s => s.img && s.enabled);
console.log('Total valid slides count:', validSlides.length);
validSlides.forEach((s, idx) => {
  console.log(`Slide ${idx + 1} (from slot ${s.num}): img = ${s.img}, link = ${s.link || '/collections/all'}`);
});
