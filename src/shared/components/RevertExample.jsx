import { Button, Popover } from 'antd'
import { RotateCcw } from 'lucide-react'

const RevertExample = ({ onClick }) => {
    return (
        <Popover
            content={
                <div style={{ textAlign: 'center' }}>
                    <span>Delete current value?</span>
                    <Button
                        style={{ marginLeft: '10px' }}
                        type="text"
                        danger
                        onClick={onClick}
                    >
                        Yes
                    </Button>
                </div>
            }
            trigger={'click'}
        >
            <Button icon={<RotateCcw size={16} />}>Example</Button>
        </Popover>
    )
}

export default RevertExample
