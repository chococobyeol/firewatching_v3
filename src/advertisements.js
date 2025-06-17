// 광고 데이터 - 나중에 광고를 추가할 수 있도록 구조화
export const advertisements = [
    {
        id: 'ad_001',
        title: '행정안전부 공지사항',
        imageUrl: 'https://www.mois.go.kr/cmm/fms/getImage.do?atchFileId=FILE_00135348ecIe8mn&fileSn=0',
        linkUrl: 'https://www.mois.go.kr/frt/sub/popup/getImage/screen.do;jsessionid=ZxZuf+0qgFvQ2EBiVA5u+SrX.node50?atchFileId=FILE_00135348ecIe8mn&fileSn=0',
        description: '행정안전부 공지사항',
        category: 'government',
        isExternal: true,
        fallbackText: '더이상 알아볼 수 없다' // 이미지 로드 실패시 표시할 텍스트
    }
    // 나중에 더 많은 광고 추가 예시:
    // {
    //     id: 'ad_002',
    //     title: '새로운 광고',
    //     imageUrl: 'https://example.com/ad2.jpg',
    //     linkUrl: 'https://example.com/ad2-page',
    //     description: '두 번째 광고 설명입니다.',
    //     category: 'commercial',
    //     isExternal: true,
    //     fallbackText: '더이상 알아볼 수 없는 광고입니다'
    // }
];

// 광고 관리 클래스
class AdvertisementManager {
    constructor() {
        this.ads = advertisements;
        this.currentAdIndex = 0;
    }

    // 랜덤 광고 가져오기
    getRandomAd() {
        return this.ads[Math.floor(Math.random() * this.ads.length)];
    }

    // 다음 광고 가져오기 (순차적)
    getNextAd() {
        const ad = this.ads[this.currentAdIndex];
        this.currentAdIndex = (this.currentAdIndex + 1) % this.ads.length;
        return ad;
    }

    // 특정 카테고리 광고 가져오기
    getAdsByCategory(category) {
        return this.ads.filter(ad => ad.category === category);
    }

    // 광고 추가
    addAd(ad) {
        this.ads.push(ad);
    }
}

// 전역 광고 매니저 인스턴스
export const adManager = new AdvertisementManager(); 