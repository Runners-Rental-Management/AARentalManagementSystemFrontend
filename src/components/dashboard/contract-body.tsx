"use client";

export interface ContractBodyProps {
  locale?: string;
  today: string;
  landlordName: string;
  landlordAddress: string;
  tenantName: string;
  tenantAddress: string;
  propertyAddress: string;
  propertyType: string;
  monthlyRent: string;
  advanceMonths: number;
  advanceAmount: string;
  leaseDuration: number;
  paymentDeadlineDay: number;
}

export function ContractBody({
  locale = "en",
  today,
  landlordName,
  landlordAddress,
  tenantName,
  tenantAddress,
  propertyAddress,
  propertyType,
  monthlyRent,
  advanceMonths,
  advanceAmount,
  leaseDuration,
  paymentDeadlineDay,
}: ContractBodyProps) {
  const isAm = locale === "am";
  const cl = "font-semibold text-slate-900 border-b border-primary-300 pb-px";
  const gap = "my-5";
  const secTitle = "font-bold text-slate-900 mt-7 mb-3 text-base";
  const clause = "mb-2 text-slate-700 leading-relaxed";

  return (
    <div className="font-[Georgia,serif] text-sm leading-7 text-slate-800 space-y-1 px-1">
      {/* Header */}
      <div className="text-center space-y-1 mb-6">
        <p className="text-xs text-slate-500">
          ቀን፡ <span className={cl}>{today}</span>
        </p>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          የመኖሪያ ቤት ኪራይ ሞዴል ውል
        </h2>
        {!isAm && (
          <p className="text-xs text-slate-500">
            (Residential Rental Agreement — Proclamation No. 1320/2016)
          </p>
        )}
      </div>

      {/* 1. Landlord */}
      <div className={gap}>
        <p className={secTitle}>1. አከራይ{!isAm && " (Landlord)"}</p>
        <p className={clause}>
          ስም ከነአያት፡ <span className={cl}>{landlordName}</span>
        </p>
        <p className={clause}>
          የመኖሪያ አድራሻ፡ <span className={cl}>{landlordAddress}</span>
        </p>
      </div>

      {/* 2. Tenant */}
      <div className={gap}>
        <p className={secTitle}>2. ተከራይ{!isAm && " (Tenant)"}</p>
        <p className={clause}>
          ስም ከነአያት፡ <span className={cl}>{tenantName}</span>
        </p>
        <p className={clause}>
          የመኖሪያ አድራሻ፡ <span className={cl}>{tenantAddress}</span>
        </p>
      </div>

      {/* 3. Property */}
      <div className={gap}>
        <p className={secTitle}>
          3. {isAm ? "የሚከራየው መኖሪያ ቤት አድራሻ" : "የሚከራየው መኖሪያ ቤት አድራሻ (Property Address)"}
        </p>
        <p className={clause}>
          {propertyAddress} — <span className={cl}>{propertyType}</span>
        </p>
      </div>

      {/* 4. Rental terms */}
      <div className={gap}>
        <p className={secTitle}>
          4. {isAm ? "የኪራይ ሁኔታ" : "የኪራይ ሁኔታ (Rental Terms)"}
        </p>
        <p className={clause}>
          1) አከራይ ከላይ የተጠቀሰውን መኖሪያ ቤት በወርሃዊ ዋጋ{" "}
          <span className={cl}>{monthlyRent} ብር</span> ለ{" "}
          <span className={cl}>{leaseDuration} ዓመት</span> ለተከራይ
          ለማከራየት ተከራይም መኖሪያ ቤቱን በዚሁ ዋጋ ለመከራየት በመስማማት ይህንን
          የመኖሪያ ቤት ኪራይ ዉል ስምምነት ተዋውለናል።
        </p>
        {!isAm && (
          <p className="text-xs text-slate-500 italic mb-2">
            (The landlord agrees to rent the above property at{" "}
            <strong>{monthlyRent} ETB/month</strong> for{" "}
            <strong>{leaseDuration} year(s)</strong>, and the tenant agrees to rent at this price.)
          </p>
        )}
        <p className={clause}>
          2) ይህ የመኖሪያ ቤት ኪራይ ውል የኪራይ ውሉ ዘመኑ ሲያበቃ በአከራይና
          ተከራይ ስምምነት በጽሑፍ ሊታደስ ይችላል።
        </p>
        <p className={clause}>
          3) የዉሃ፣ የስልክ፣ የመብራት፣ የጥበቃ፣ የፅዳት ወይም ሌሎች አገልግሎቶች
          ክፍያ ተከራይ ይሆናል።
        </p>
        {!isAm && (
          <p className="text-xs text-slate-500 italic mb-2">
            (Water, phone, electricity, security, cleaning and other service fees
            are the tenant&apos;s responsibility.)
          </p>
        )}
      </div>

      {/* 5. Landlord obligations */}
      <div className={gap}>
        <p className={secTitle}>
          5. {isAm ? "የአከራይ ግዴታዎች" : "የአከራይ ግዴታዎች (Landlord Obligations)"}
        </p>
        <p className={clause}>
          1) አከራይ በውል ስምምነቱ ላይ ከተመለከተው የኪራይ ዋጋ ጭማሪ ማድረግ
          የሚችለው በመኖሪያ ቤት ኪራይ ቁጥጥር እና አስተዳደር አዋጅ ቁጥር{" "}
          <span className={cl}>1320/2016</span> መሠረት ተቆጣጣሪው አካሉ
          በየዓመቱ የሚያደርገውን ዋጋ ማሻሻያ መሰረት በማድረግ ብቻ ይሆናል።
        </p>
        {!isAm && (
          <p className="text-xs text-slate-500 italic mb-2">
            (The landlord may only increase rent in accordance with the annual adjustment set by the regulatory body under Proclamation 1320/2016.)
          </p>
        )}
        <p className={clause}>
          2) አከራይ ዋጋ ሲጨምር ለተከራይና ለተቆጣጣሪው አካሉ በጽሁፍ ማሳወቅ
          አለበት።
        </p>
      </div>

      {/* 6. Tenant obligations */}
      <div className={gap}>
        <p className={secTitle}>
          6. {isAm ? "የተከራይ ግዴታዎች" : "የተከራይ ግዴታዎች (Tenant Obligations)"}
        </p>
        <p className={clause}>
          1) ቅድሚያ ክፍያ{" "}
          <span className={cl}>{advanceMonths} ወር</span> — የብር{" "}
          <span className={cl}>{advanceAmount}</span> በዛሬው ዕለት
          ለአከራይ ተከፍሏል። ቀጣዩ ክፍያ ወርሃዊ ሆኖ በየወሩ ወር
          በገባ እስከ{" "}
          <span className={cl}>{paymentDeadlineDay}ኛ ቀን</span> ለመክፈል
          ተስማምቻለሁ።
        </p>
        {!isAm && (
          <p className="text-xs text-slate-500 italic mb-2">
            (Advance payment of <strong>{advanceMonths} month(s)</strong> — ETB {advanceAmount} paid today.
            Monthly rent is due by the <strong>{paymentDeadlineDay}th</strong> of each month.)
          </p>
        )}
        <p className={clause}>
          2) ተከራይ የኪራይ ውሉ ዘመን ሳይጠናቀቅ ቤቱን ለመልቀቅ ከፈለገ
          የ<span className={cl}>ሁለት ወር</span> ቀደም ማስታወቂያ
          ለአከራዩ መስጠት አለበት።
        </p>
        <p className={clause}>
          3) ተከራይ የኪራይ ቤቱን ጠብቆ ጉዳት ሳያደርስ ሲያልቅ ለአከራይ
          የማስረከብ ኃላፊነት አለበት።
        </p>
        <p className={clause}>
          4) ተከራይ ክፍያ የሚፈጽመው በባንክ ወይም በህጋዊ ኤሌክትሮኒክ
          ዘዴ ብቻ ነው።
        </p>
        {!isAm && (
          <p className="text-xs text-slate-500 italic mb-2">
            (Tenant must pay via bank or legal electronic payment only.)
          </p>
        )}
      </div>

      {/* 7 & 8 */}
      <div className={gap}>
        <p className={clause}>
          <span className="font-bold">7.</span> በዚህ ውል ባልተሸፈኑ ጉዳዮች
          ላይ የመኖሪያ ቤት ኪራይ ቁጥጥር እና አስተዳደር አዋጅ ቁጥር 1320/2016
          ተፈጻሚ ይሆናል።
        </p>
        {!isAm && (
          <p className="text-xs text-slate-500 italic mb-1">
            (Matters not covered by this agreement are governed by Proclamation 1320/2016.)
          </p>
        )}
        <p className={clause}>
          <span className="font-bold">8.</span> ይህ ውል በአከራይና በተከራይ
          ተፈርሞ በተቆጣጣሪው አካሉ ሲረጋገጥ የፀና ይሆናል።
        </p>
        {!isAm && (
          <p className="text-xs text-slate-500 italic mb-1">
            (This agreement becomes effective when signed by both parties and confirmed by the regulatory authority.)
          </p>
        )}
      </div>
    </div>
  );
}
