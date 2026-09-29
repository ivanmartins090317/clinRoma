import Image from "next/image";

export function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-marca">
        <div className="page-loader-crescer">
          <Image
            src="/brand/loader-spiner.svg"
            alt="Carregando"
            width={72}
            height={72}
            priority
            className="page-loader-girar"
          />
        </div>
      </div>
    </div>
  );
}
