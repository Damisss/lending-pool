import { FunctionComponent } from 'react'

type CustomInput = {
    id: string
    name: string
    value: string | number
    onChange: ()=>{}
    type: string,
    label: string
    onMax?: ()=>void
    isBorrowOption: boolean
}
export const CustomInput:FunctionComponent<CustomInput> = ({
    id,
    name,
    value,
    onChange,
    type,
    label,
    onMax,
    isBorrowOption
})=>{

    return(
        <div className="flex flex-col-reverse my-4 w-full">
            <div className="place-self-center place-self-center w-10/12 flex flex-row  border-solid border-b-4 focus-within:border-b-blue-400">
                <input
                    className="h-12 focus:outline-none text-xl w-full grow"
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    type={type}
                    placeholder='0'
                />
                {!isBorrowOption && 
                    <button onClick={onMax} type="button" className="bg-blue-400 hover:bg-blue-600 text-white rounded px-4 py-0 h-1/2 m-auto">
                        Max
                    </button>
                }
            </div>
            <label className="font-semibold place-self-center" htmlFor={name}>{label}</label>
        </div>
    )
}