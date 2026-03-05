import Image from "next/image";

const Logo = () => {
    return ( 
        <>
        <div className="md:block hidden">
            <Image src="/logo_a.png" alt="logo" width={150} height={150} />
        </div>
        <div className="block md:hidden">
            <Image src="/logo.png" alt="logo" width={40} height={40} />
        </div>
        </> 
        
    );
}
 
export default Logo;